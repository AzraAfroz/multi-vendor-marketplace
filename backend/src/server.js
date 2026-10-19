const { required } = require('./config/env')
const app = require('./app')
const connectDatabase = require('./config/database')

async function start() {
  try {
    const mongoUri = required('MONGODB_URI')
    const jwtSecret = required('JWT_SECRET')
    if (jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long.')
    await connectDatabase(mongoUri)
    const port = Number(process.env.PORT) || 5001
    app.listen(port, () => console.log(`API listening on port ${port}`))
  } catch (error) {
    console.error(`Could not start server: ${error.message}`)
    process.exit(1)
  }
}

start()
