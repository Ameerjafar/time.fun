use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token as TokenProgram, TokenAccount};

declare_id!("HWrXGnz3Yu8t4P3UBEnS2Mdzt5YuT1FdvNuds1r5LnMW");


#[program]
pub mod bonding_curve {
    use anchor_spl::token::TransferChecked;
    use super::*;

    pub fn initialize(
        ctx: Context<InitializePool>,
        initial_sol: u64,
        initial_token: u64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.pool;

        // Set initial state
        state.reserve_x = initial_sol;
        state.reserve_y = initial_token;
        state.token_x_mint = ctx.accounts.token_x_mint.key();
        state.token_y_mint = ctx.accounts.token_y_mint.key();
        state.constant_k = (initial_sol as u128) * (initial_token as u128);

        // Transfer initial token X from user to pool
        let cpi_accounts_x = TransferChecked {
            from: ctx.accounts.user.to_account_info(), // User's token X account
            to: ctx.accounts.pool_token_x_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
            mint: ctx.accounts.token_x_mint.to_account_info(),
        };
        let cpi_ctx_x =
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts_x);
        anchor_spl::token::transfer_checked(cpi_ctx_x, initial_sol, ctx.accounts.token_x_mint.decimals)?;

        // Transfer initial token Y from user to pool
        let cpi_accounts_y = TransferChecked {
            from: ctx.accounts.user.to_account_info(), // User's token Y account
            to: ctx.accounts.pool_token_y_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
            mint: ctx.accounts.token_y_mint.to_account_info(),
        };
        let cpi_ctx_y =
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts_y);
        anchor_spl::token::transfer_checked(cpi_ctx_y, initial_token, ctx.accounts.token_y_mint.decimals)?;

        Ok(())
    }

    pub fn buy(ctx: Context<Buy>, amount_out_token: u64) -> Result<()> {
        let state = &mut ctx.accounts.pool;
        let sol_reserve = state.reserve_x as u128;
        let token_reserve = state.reserve_y as u128;
        let k = sol_reserve * token_reserve;
        require!(
            amount_out_token <= state.reserve_y,
            CustomError::NotEnoughTokensInPool
        );

        let new_token_reserve = token_reserve - amount_out_token as u128;
        let new_sol_reserve = k / new_token_reserve;
        let amount_in_sol = new_sol_reserve - sol_reserve;

        let amount_in_sol_u64 = amount_in_sol as u64;
        state.reserve_x += amount_in_sol_u64;
        state.reserve_y -= amount_out_token;
        **ctx
            .accounts
            .pool_sol_account
            .to_account_info()
            .try_borrow_mut_lamports()? += amount_in_sol_u64;
        **ctx
            .accounts
            .user
            .to_account_info()
            .try_borrow_mut_lamports()? -= amount_in_sol_u64;

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_spl::token::transfer(cpi_ctx, amount_out_token)?;

        Ok(())
    }

    pub fn sell(ctx: Context<Sell>, amount_in_token: u64) -> Result<()> {
        let state = &mut ctx.accounts.pool;

        let sol_reserve = state.reserve_x as u128;
        let token_reserve = state.reserve_y as u128;
        let k = sol_reserve * token_reserve;
        let new_token_reserve = token_reserve + amount_in_token as u128;
        let new_sol_reserve = k / new_token_reserve;
        let amount_out_sol = sol_reserve - new_sol_reserve;
        let amount_out_sol_u64 = amount_out_sol as u64;

        state.reserve_x -= amount_out_sol_u64;
        state.reserve_y += amount_in_token;
        **ctx
            .accounts
            .pool_sol_account
            .to_account_info()
            .try_borrow_mut_lamports()? -= amount_out_sol_u64;
        **ctx
            .accounts
            .user
            .to_account_info()
            .try_borrow_mut_lamports()? += amount_out_sol_u64;
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.pool_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_spl::token::transfer(cpi_ctx, amount_in_token)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolState>,

    /// CHECK: This account is safe because it's the pool SOL vault controlled by our program
    #[account(mut)]
    pub pool_sol_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, TokenProgram>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolState>,
    /// CHECK: This account is safe because it's the pool SOL vault controlled by our program
    #[account(mut)]
    pub pool_sol_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, TokenProgram>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub token_x_mint: Account<'info, Mint>,
    #[account(mut)]
    pub token_y_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<PoolState>(),
        seeds = [b"pool", token_x_mint.key().as_ref(), token_y_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, PoolState>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub pool_token_x_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_y_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, TokenProgram>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[error_code]
pub enum CustomError {
    #[msg("Not enough tokens in the pool")]
    NotEnoughTokensInPool,
}

#[account]
pub struct PoolState {
    pub reserve_x: u64,
    pub reserve_y: u64,
    pub token_x_mint: Pubkey,
    pub token_y_mint: Pubkey,
    pub constant_k: u128,
}
