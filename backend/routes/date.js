const router = require('express').Router();
const mongoose = require('mongoose');
const DateModel = require('../models/dateModel')
const jwt = require('jsonwebtoken');
const yearModel = require('../models/yearModel');

router.get('/', async (req, res)=>{
    try {
        const { date } = req.query;
        const token = req.headers.authorization;
        const { _id } = jwt.decode(token);

        const entry = await DateModel.findOne({ date: date, user: _id });

        if (entry) {
            res.json(entry);
        } else {
            res.status(404).json({});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.post('/', async (req, res)=>{
    try{
        const {title, content, image, mood } = req.body;
        const token = req.headers.authorization;
        const {_id} = jwt.decode(token);
        
        const date = new Date(req.body.date);
        let entry = await DateModel.findOne({user: _id, date});
        
        if(!entry){
            entry = await DateModel.create({
                user: _id,
                title, 
                content, 
                image, 
                mood,
                date
            });
        }else{
            entry.title = title;
            entry.content = content;
            entry.image = image;
            entry.mood = mood;
            await entry.save();
        }
        
        let yearEntry = await yearModel.findOne({user: _id, year: date.getFullYear()});
        
        if(!yearEntry){
            yearEntry = await yearModel.create({
                user: _id,
                year: date.getFullYear(),
                data: [{date, mood}]
            });
        } else {
            // Use findIndex and update for more efficient logic
            const existingEntryIndex = yearEntry.data.findIndex(item =>
                new Date(item.date).getDate() === date.getDate() &&
                new Date(item.date).getMonth() === date.getMonth()
            );

            if (existingEntryIndex > -1) {
                yearEntry.data[existingEntryIndex].mood = mood;
                console.log("Date Found!!!");
            } else {
                yearEntry.data.push({date, mood});
            }
            await yearEntry.save();
        }

        res.status(200).send("Wonderful");
    } catch(err){
        console.error(err);
        res.status(500).json({"message":"Server Error While Adding Date Entry", "Error": err});
    }
});
    
module.exports = router;