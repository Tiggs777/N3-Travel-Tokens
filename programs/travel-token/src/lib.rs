use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, InitializeMint, MintTo, Transfer};

declare_id!("SoxhWK5z1d7EHvWk3WHqjENBUopRzj4KzzLWXvJ1sXm");

#[program]
pub mod travel_token {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Token program initialized");
        Ok(())
    }

    pub fn create_token(ctx: Context<CreateToken>, supply: u64) -> Result<()> {
        let cpi_accounts = InitializeMint {
            mint: ctx.accounts.mint.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::initialize_mint(
            CpiContext::new(cpi_program.clone(), cpi_accounts),
            9,
            &ctx.accounts.authority.key(),
            None,
        )?;

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        token::mint_to(CpiContext::new(cpi_program, cpi_accounts), supply)?;
        msg!("Token minted: {}", supply);
        Ok(())
    }

    pub fn airdrop(ctx: Context<Airdrop>, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;
        msg!("Airdropped {} tokens", amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(init, payer = authority, space = Mint::LEN)]
    pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, space = TokenAccount::LEN)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Airdrop<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}