const { v4: uuidv4 } = require("uuid");
const { readFileSync, writeFileSync } = require("fs");
const { MongoClient,ObjectId  } = require('mongodb');

const DATABASE_URL = 'mongodb+srv://Akash:aCCcZp2cZ4QDstOh@cluster0.izqpfng.mongodb.net/?retryWrites=true&w=majority'; 
const DATABASE_NAME = 'Forms'; 
const COLLECTION_NAME = 'forms';

const saveFormData = async (formJson) => {
    try {
        const url = uuidv4();
        const date = new Date().toLocaleString();
        const client = new MongoClient(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const database = client.db(DATABASE_NAME);
        const collection = database.collection(COLLECTION_NAME);
        await collection.insertOne({ url, formJson, date });
        client.close();
        return url;
    } catch (e) {
        console.error(e);
    }
};


const getAllForms = async () => {
    try {
        const client = new MongoClient(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const database = client.db(DATABASE_NAME);
        const collection = database.collection(COLLECTION_NAME);
        const forms = await collection.find().toArray();
        client.close(); // Close the database connection
        return forms;
    } catch (e) {
        console.error(e);
    }
};


const getFormById = async (id) => {
    try {
        const client = new MongoClient(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const database = client.db(DATABASE_NAME);
        const collection = database.collection(COLLECTION_NAME);
        // Convert the id string to ObjectId (MongoDB ObjectId)
        const objectId = new ObjectId(id);
        // Find the document with the specified ObjectId
        const requiredForm = await collection.findOne({ _id: objectId });
        client.close(); // Close the database connection
        return requiredForm ? [requiredForm] : [];
    } catch (e) {
        console.error(e);
    }
};

const saveResponse = async (responseJson) => {
    try {
        const client = new MongoClient(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const database = client.db(DATABASE_NAME);
        const collection = database.collection(COLLECTION_NAME);
        const { id, response } = responseJson;
        const objectId = new ObjectId(id);
        const existingResponse = await collection.findOne({ _id: objectId });
        if (existingResponse) {
            const len = existingResponse.responses.length;
            await collection.updateOne(
                { _id: objectId },
                { $set: { [`responses.${len}`]: response } }
            );
        } else {
            await collection.insertOne({ _id: objectId, responses: [response] });
        }
        client.close(); // Close the database connection
    } catch (error) {
        console.error(error);
    }
};

const getTotalResponseCount = async () => {
    try {
        const client = new MongoClient(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const database = client.db(DATABASE_NAME);
        const collection = database.collection(COLLECTION_NAME);
        const responseCounts = await collection.aggregate([
            {
                $group: {
                    _id: '$_id',
                    count: { $sum: { $size: '$responses' } }
                }
            }
        ]).toArray();
        client.close(); // Close the database connection
        // Format the result as an object with form IDs and their response counts
        const responseCount = responseCounts.reduce((acc, curr) => {
            acc[curr._id.toString()] = curr.count;
            return acc;
        }, {});
        return responseCount;
    } catch (error) {
        console.error(error);
    }
};
module.exports = {
	saveFormData,
	getAllForms,
	getFormById,
	saveResponse,
	getTotalResponseCount,
};
