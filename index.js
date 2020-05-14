const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const shortid = require('shortid');

const app = express();

const uri = 'https://johnmeade-webdev.github.io/chingu_quiz_api/trial.json';

async function getData(uri){
    const response = await axios.get(uri)
    .catch(e=>console.log(e));
    const data = await response.data;
    return data;
}

function getIndex(list){
    return Math.floor(Math.random()*list.length);
}



app.use(express.static(path.join(__dirname,'client/build')));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

const userSchema = new Schema({
    _id: {type:String,required:true},
    questions : {type:[Object],required:true,default:[]}
  });

mongoose.connect('mongodb+srv://ssousa666:168799@cluster0-tywsa.mongodb.net/test?retryWrites=true&w=majority',{useNewUrlParser:true,useUnifiedTopology:true},(e,d)=>{
    if (e) console.log(e);
    else console.log('db connected');
})
  
const User = mongoose.model('TriviaUser',userSchema);

app.get('/api/init',async (req,res)=>{
    let data = await getData(uri)
    .catch(e=>console.log(e));
    console.log(data);
    let userid = shortid.generate();
  
    // add 'asked' field (boolean) to question objects
    let questions = data.slice().map(d=>{
      return Object.assign(d,{asked:false});
    });
  
    let index = getIndex(questions);
  
    //define initial question and set 'asked' field to true
    let initQ = questions[index];
    questions[index].asked=true;
  
    
  // define user to store question data in database
    let user = new User({
      _id: userid,
      questions: questions
    });
  
    await user.save()
    .catch(e=>console.log(e));
  
    res.json({
      id: userid,
      initQ : initQ
    });
  })
  
  app.get('/api/question/:userid',async (req,res)=>{
    //receive userid from react App state
    const {userid} = req.params;
  
    //find user in mongodb collection
    let user = await User.findById(userid)
    .catch(e=>console.log(e));
  
    /* filter out questions that have already been asked, then
    assign a random index, then assign the variable newQ the question at
    that random index */
    let questions = user.questions.slice().filter(q=>q.asked===false);
    let index = getIndex(questions);
    let newQ = questions[index];
  
    /* make shallow copy of user's questions array,
    then iterate through questions and set the 'asked' field
    of our newQ variable's equivalent to true */
    questions = user.questions.slice();
    questions.forEach(q=>{
      if (q.id===newQ.id) q.asked=true;
    })
  
    /* update the user's database record to reflect the new data in
    the questions array*/
    await User.findByIdAndUpdate(userid,{$set:{questions:questions}})
    .catch(e=>console.log(e));
  
    //return new question to the React front end
    res.json({newQ:newQ});
  })
  
  app.get('/api/filter',async (req,res)=>{
  
  /* define query paramaters for filtering
  question topics */
  
   const {userid} = req.query,
   {filter1} = req.query,
   {filter2} = req.query;
  
   // retrieve user record from the database
   let user = await User.findById(userid)
    .catch(e=>console.log(e));
  
    /* first, filter the user's questions array to include only questions that have
    not already been asked.
    then, if only one filter is applied, filter the array to include only questions that belong
    to the filtered topic. Else if two filters are applied, filter only questions that belong to either
    topic  */
    let questions = user.questions.slice().filter(q=>q.asked===false);
    if (filter2===undefined){
      questions = questions.filter(q=>q.topic===filter1);
    }else{
      questions = questions.filter(q=>q.topic===filter1||q.topic===filter2);
    };
  
    let index = getIndex(questions);
    let newQ = questions[index];
  
    questions = user.questions.slice();
    questions.forEach(q=>{
      if (q.id===newQ.id) q.asked = true;
    })
  
    await User.findByIdAndUpdate(userid,{$set:{questions:questions}})
    .catch(e=>console.log(e));
  
    res.json({newQ:newQ});
  
   
  
   
    
  })





app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
  });
  
  const port = process.env.PORT || 5000;
  app.listen(port);
  
  console.log(`Chingu Trivia is listening on ${port}`);