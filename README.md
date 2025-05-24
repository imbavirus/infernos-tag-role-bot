# Infernos Tag Role Bot

A Discord bot that automatically manages roles based on server tags. When a member has a server tag, they are automatically assigned a specified role. Built with Next.js, Discord.js, and Prisma.

## Features

- 🏷️ **Automatic Role Management**: Assigns roles to members wearing server tags
- 📊 **Web Dashboard**: Easy-to-use interface for configuring roles and channels
- 📝 **Activity Logging**: Tracks role changes in a dedicated channel
- 🔄 **Real-time Updates**: Instantly updates roles when tags change
- 🔒 **Secure**: Built with security best practices and proper permission handling

## Prerequisites

- Node.js 18+
- MySQL server
- Discord Bot Token
- Discord Application with proper intents

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=mysql://user:password@localhost:3306/bot_db

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
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
2. Sign in with your Discord account
3. Select a server from the dropdown
4. Configure the bot:
   - Select a role to assign to members with server tags
   - Choose a channel for logging role changes (optional)
5. Save the configuration

The bot will automatically:
- Assign the selected role to members who have a server tag
- Remove the role when members no longer have the tag
- Log all role changes in the selected channel

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linter
- `npm run prisma:studio` - Open Prisma Studio for database management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 