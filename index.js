const express = require('express')
const Sequelize = require('sequelize')
const bodyparser = require('body-parser')
const Sse = require('json-sse')



const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:secret@localhost:5432/postgres'
const db = new Sequelize(databaseUrl, {logging: false }    )
const stream = new Sse()

db
    .sync({force: false})   
    .then( () => console.log("Database Synced"))   



const Message = db.define('message', {
    text: Sequelize.STRING,
    user: Sequelize.STRING,
    channelId: Sequelize.STRING
})
const Channel = db.define("channel", {
    name: Sequelize.STRING  
})

Message.belongsTo(Channel)
Channel.hasMany(Message)



const port = process.env.PORT || 5000
const jsonParser =  bodyparser.json()

const app = express()
app.use(jsonParser)


app.listen(port , () => console.log(`Listning on port: ${port}`))


app.get('/', (request, response) => { console.log("Got a request on /")
    response.status(200)
    response.send("hello world")
})



app.post("/channel", async (request, response) =>{
    console.log("request on /channel ", request.body)
    const { channelname } = request.body
    const entity = await Channel.create({
        name: channelname
    })
    // response.status(200)
    // response.send(`your new channel id is: ${entity.dataValues.id}`)

    const channels = await Channel.findAll({attributes: ['id','name']})
    //console.log('channels',channels)
    const data = JSON.stringify(channels)
    console.log("data is", data)
    stream.updateInit(data)
    stream.send(data)
})


app.get('/stream', async (request, response) => {
   const channels = await Channel.findAll({attributes: ['id','name']})
   //console.log('channels',channels)
   const data = JSON.stringify(channels)
   console.log("data is", data)
   stream.updateInit(data)
   stream.init(request,response)
   //testing with httpie requires the "--stream" option !
})









