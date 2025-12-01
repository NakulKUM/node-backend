require('dotenv').config()
const express = require('express')
const app = express()
const port = 4000

const jokes= [{
  id: 1,
  title: 'first joke',
  description: 'first joke description'
},{
  id: 2,
  title: 'second joke',
  description: 'second joke description'
},{
  id: 3,
  title: 'third joke',
  description: 'third joke description'
}]

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/twitter', (req, res)=>{
   res.send('nakul')
} )

app.get('/api/jokes', (req, res)=>{
   res.send(jokes)
} )

app.get('/login', (req, res)=>{
   res.send('<h1>Please login at chai and code</h1>')
} )

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${port}`)
})
