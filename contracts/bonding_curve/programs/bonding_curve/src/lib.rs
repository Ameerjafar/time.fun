use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;

declare_id!("EJGrTzirrsJ2ukMdomaXrR31GcHpFckqqir6dqyZEx5S");

#[program]
pub mod bonding_curve {
    use super::*;

    pub fn initialize(
        ctx: Context<InitializePool>,
        initial_sol: u64,
        initial_token: u64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.pool;

        // Set initial state
        state.reserve_sol = initial_sol;
        state.reserve_token = initial_token;
        state.token_mint = ctx.accounts.token_mint.key();
        state.constant_k = (initial_sol as u128) * (initial_token as u128);
        state.bump = ctx.bumps.pool;

        // Transfer native SOL from user to pool
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.pool.key(),
            initial_sol,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.pool.to_account_info(),
            ],
        )?;

        // Transfer initial tokens from user to pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.pool_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, initial_token)?;

        Ok(())
    }

    pub fn buy(ctx: Context<Buy>, amount_out_token: u64) -> Result<()> {
        // Store values we need BEFORE borrowing mutably
        let token_mint = ctx.accounts.pool.token_mint;
        let bump = ctx.accounts.pool.bump;
        
        let state = &mut ctx.accounts.pool;
        
        // Calculate using constant product formula: x * y = k
        let sol_reserve = Decimal::from(state.reserve_sol);
        let token_reserve = Decimal::from(state.reserve_token);
        let k = sol_reserve * token_reserve;
        
        require!(
            amount_out_token <= state.reserve_token,
            CustomError::NotEnoughTokensInPool
        );

        // Calculate how much SOL is needed
        let new_token_reserve = token_reserve - Decimal::from(amount_out_token);
        let new_sol_reserve = k / new_token_reserve;
        let amount_in_sol = new_sol_reserve - sol_reserve;
        let amount_in_sol_u64 = amount_in_sol.ceil().to_u64().unwrap();

        // Update reserves
        state.reserve_sol += amount_in_sol_u64;
        state.reserve_token -= amount_out_token;

        // Transfer native SOL from user to pool
        let pool_key = state.key();
        drop(state); // Release mutable borrow
        
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &pool_key,
            amount_in_sol_u64,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.pool.to_account_info(),
            ],
        )?;

        // Transfer tokens from pool to user
        let seeds = &[
            b"pool",
            token_mint.as_ref(),
            &[bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount_out_token)?;

        Ok(())
    }

    pub fn sell(ctx: Context<Sell>, amount_in_token: u64) -> Result<()> {
        let state = &mut ctx.accounts.pool;

        // Calculate using constant product formula: x * y = k
        let sol_reserve = Decimal::from(state.reserve_sol);
        let token_reserve = Decimal::from(state.reserve_token);
        let k = sol_reserve * token_reserve;
        
        let new_token_reserve = token_reserve + Decimal::from(amount_in_token);
        let new_sol_reserve = k / new_token_reserve;
        let amount_out_sol = sol_reserve - new_sol_reserve;
        let amount_out_sol_u64 = amount_out_sol.floor().to_u64().unwrap();

        require!(
            amount_out_sol_u64 <= state.reserve_sol,
            CustomError::NotEnoughSolInPool
        );

        // Update reserves
        state.reserve_sol -= amount_out_sol_u64;
        state.reserve_token += amount_in_token;

        // Transfer tokens from user to pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.pool_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount_in_token)?;

        // Transfer native SOL from pool to user
        **ctx.accounts.pool.to_account_info().try_borrow_mut_lamports()? -= amount_out_sol_u64;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += amount_out_sol_u64;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<PoolState>(),
        seeds = [b"pool", token_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, PoolState>,

    #[account(mut)]
    pub user: Signer<'info>,

    // User's token account (source of initial liquidity)
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    // Pool's token account (destination for tokens)
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.token_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, PoolState>,

    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.token_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, PoolState>,

    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PoolState {
    pub reserve_sol: u64,
    pub reserve_token: u64,
    pub token_mint: Pubkey,
    pub constant_k: u128,
    pub bump: u8,
}

#[error_code]
pub enum CustomError {
    #[msg("Not enough tokens in the pool")]
    NotEnoughTokensInPool,
    #[msg("Not enough SOL in the pool")]
    NotEnoughSolInPool,
}