// server.js is starting point
const mongo = require('mongodb').MongoClient; // mongodb is the native driver
const client = require('socket.io').listen(4000).sockets; // allows us to run socket.io on port 4000

// Connect to mongo
// db is used to run queries
// function(err,db) is a callback function
// mongodb://127.0.0.1/mongochat is the url
mongo.connect('mongodb://127.0.0.1/mongochat',function(err,db)
{
	if(err) // to check for and throw error
	{
		throw err;
	}

	console.log("MongoDB Connected") // To verify that our app is running

	// Connect to socket.io
	client.on('connection',function(socket){
		let chat = db.db('chats'); // making a collection in the database known as chats

		// Create function to send status
		sendStatus = function(s) // s is status
		{
			socket.emit('status', s); // .emit is used to pass message from server to client & vice versa
		}

		chat.createCollection('chats',function(err,res)
		{
			if (err) throw err;
		});

		// Get chats from mongo collection
		chat.collection('chats').find().limit(100).sort({_id:1}).toArray(function(err,res) // setting a limit of 100 chats and sorting it by id starting from 1
			{
				if(err)
				{
					throw err;
				}

				// Emit the messages
				socket.emit('output',res) // Emitting the messages from the mongodb collection to client
			});

		// Handle input events
		socket.on('input',function(data) // on is used to catch things from the client
		{
			// Whatever used send from client is stored in data variable
			let name = data.name;
			let message = data.message;

			// Check for name and message
			if(name == '' || message== '') // To check if any of the name or message is left empty
			{
				// Send error status
				sendStatus("Please enter a name and a message");
			}
			else
			{
				// Insert message to database
				chat.collection('chats').insert({name: name, message:message}, function() // Here we are passing an object 
				{
					client.emit('output',[data]); // Sending output back to client

					// Send status object
					sendStatus(
					{
						message : 'Message Sent',
						clear: true // To see if we want to clear messages or not
					});
				});
			}
		});

		// Handle clear
		socket.on('clear', function(data)
		{
			// Remove chats from the collection
			chat.collection('chats').remove({}, function()
			{
				// Emit cleared
				socket.emit('cleared');
			});
		});
	});
});