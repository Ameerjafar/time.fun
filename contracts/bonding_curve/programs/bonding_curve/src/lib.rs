use anchor_lang::prelude::*;

declare_id!("5fYh6iWZzBp4HwizfgeX1NoKWApNCMQNwANjzF5qh7mq");

#[program]
pub mod bonding_curve {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
