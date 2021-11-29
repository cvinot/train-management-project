const express = require('express')
const fs = require('fs')
const app = express()
const PORT = process.env.PORT
let todos = []

app.use(express.static('client'));
app.use(express.json());

app.get('/todos', (req,res) => {
    todos = JSON.parse(fs.readFileSync('todos.json', 'utf8'))
    res.send(todos)
})

app.post('/todos', (req,res) => {
    todos.push(req.body)
    fs.writeFileSync('todos.json', JSON.stringify(todos, null, 4)); //pretty-print JSON in file
    res.send(todos)
})

app.delete('/todos/:index', (req,res) => {
    const index = parseInt(req.params.index)
    todos.splice(index,1)
    fs.writeFileSync('todos.json', JSON.stringify(todos, null, 4));
    res.send(todos)
})

app.put('/todos/:index', (req,res) => {
    const index = parseInt(req.params.index)
    todos[index] = req.body
    fs.writeFileSync('todos.json', JSON.stringify(todos, null, 4));
    res.send(todos)
})

app.listen(PORT, () => {
    console.log('I listen on port '+PORT)
})