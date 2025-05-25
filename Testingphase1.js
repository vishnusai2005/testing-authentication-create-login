const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body

  const selectUserQuery = `SELECT * 
  FROM user 
  WHERE username = '${username}' `

  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const createUserQuery = `
  INSERT INTO user (username, name, password,gender, location)
  VALUES (
    '${username}',
    '${name}',
    '${hashedPassword}',
    '${gender}',
    '${location}'

  )`

      const dbResponse = await db.run(createUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const dataFetchingOne = `
  SELECT * 
  FROM user 
  WHERE username = '${username}' `
  const dbUserTwo = await db.get(dataFetchingOne)
  if (dbUserTwo === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUserTwo.password)
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkingThree = `
  SELECT * 
  FROM user 
  WHERE username = '${username}'`
  const gettingThree = await db.get(checkingThree)
  if (gettingThree === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const hashPassword = await bcrypt.compare(
      oldPassword,
      gettingThree.password,
    )
    if (hashPassword === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const updatingHashPassword = await bcrypt.hash(newPassword, 10)
        const finalUpdatePassword = `
        UPDATE user 
        SET password = '${updatingHashPassword}' `
        const finalThree = await db.run(finalUpdatePassword)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
