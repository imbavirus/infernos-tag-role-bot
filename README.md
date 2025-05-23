# Infernos Tag Role Bot

A Discord bot that automatically manages roles based on server tags, built with Next.js and Discord.js.

## Features

- Automatic role management based on server tags
- Web dashboard for configuration
- Support for multiple guilds
- Role change logging
- MySQL database for configuration storage

## Prerequisites

- Node.js 18+
- MySQL server
- Discord Bot Token
- Discord Application with proper intents

## Environment Variables

Create a `.env` file in the root directory:

```env
# Discord Bot
DISCORD_TOKEN=your_discord_bot_token

# Database
DATABASE_URL=mysql://user:password@localhost:3306/bot_db
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/infernos-tag-role-bot.git
cd infernos-tag-role-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. Visit `http://localhost:3000` to access the web dashboard
2. Add your guild configuration:
   - Guild ID
   - Representors Role ID
   - Log Channel ID (optional)

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linter

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 