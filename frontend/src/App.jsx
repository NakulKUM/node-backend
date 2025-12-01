import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios';

function App() {
  const [jokes, setJokes] = useState([])
  const getJokes = async()=> {
    await axios.get('/api/jokes')
    .then((res)=>{
      setJokes(res.data)
    })
    .catch((err)=> console.log(err) )
  }
  useEffect(()=> {
    getJokes();
  },[])

  return (
    <>
      <h1>Chai aur code</h1>
      <p>Jokes: {jokes.length}</p>
      <ul>{jokes.map((joke)=> <li key={joke.id}>
        <h3>{joke.title}</h3>
        <p>{joke.description}</p>
      </li>
      )}
      </ul> 
    </>
  )
}

export default App
