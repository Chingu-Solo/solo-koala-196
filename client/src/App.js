import React from 'react';
import './App.css';
const axios = require('axios');


// selects filters for calls to the back end
class Topics extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      selected : [{name:'javascript',selected:false},
      {name:'css',selected:false},
      {name:'html',selected:false}]
    }
    this.selectTopic = this.selectTopic.bind(this);
    this.extractStyle = this.extractStyle.bind(this);
    this.resetSelections = this.resetSelections.bind(this);
  }


  

 


  selectTopic(e){
    
    let selected = this.state.selected.slice();
    let id = e.target.id;
    selected.forEach(el=>{
      if (el.name===id) el.selected = !el.selected;
    })
    this.setState({
      selected : selected
    })
  
  this.props.update(this.state.selected);
  }


  extractStyle(str){
    let selections = this.state.selected.slice();
    let classN = selections.filter(el=>el.name===str)[0];
    if (classN.selected===true){
      return 'selected';
    }else return null;
  }

  resetSelections(){
    let selections = this.state.selected.slice();
    selections.forEach(el=>el.selected=false);
    this.setState({
      selected: selections
    })
  }

  

 



  render(){


    let jsClass = this.extractStyle('javascript'),
    htmlClass = this.extractStyle('html'),
    cssClass = this.extractStyle('css');

    

    

    return(
    <div id='topics'>
      <span>filter topics</span>
      <button id='css' className={cssClass} onClick={this.selectTopic}>css</button>
      <button id ='javascript' className={jsClass} onClick={this.selectTopic}>js</button>
      <button id ='html' className={htmlClass} onClick={this.selectTopic}>html</button>
      <button id ='reset' onClick={this.resetSelections}><i id="reset" className="fa fa-refresh" aria-hidden="true"></i></button>
  
    </div>
    );



  }
}


// initial display, before quiz has begun
class InitDisplay extends React.Component{
  constructor(props){
    super(props);
    this.beginQuiz = this.beginQuiz.bind(this);
  }

  beginQuiz(){
    this.props.begin();
  }

  render(){
 
    return (<div className='init-message'><h4>test your web development knowledge!<br/>
    select categories in the top right corner of the window, or
     leave unselected to receive questions from all categories!</h4>
     <button className='begin-quiz' onClick={this.beginQuiz}>start</button>
     </div>);
 
}
}

// displays topic filters that are currently applied
function Filters(props) {
  let str = "";
  if (props.selected.length===0){
    return null;
  }else{
    let selected = props.selected.filter(el=>el.selected===true);
    if (selected.length===3) return null;
    else{
      if (selected.length===2) str+= `${selected[0].name} & ${selected[1].name} questions only`;
      else if (selected.length===1) str += `${selected[0].name} questions only`;
    }
  }
  return(<div id='filter-display'>{str}</div>);
}

// displays the question received from the server
class Question extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      answered : false
    }
  }

  

  passQuestion(){
    return this.props.question;
  }



  render(){
    let question = this.passQuestion();
    if (question===null){
    
    return (<div></div>);
    }else{
      return( <div className='question-box'>{question.question}</div>)
    }
}
}


/* advances the quiz, updates the App's state and displays a unique message
dependant on if the given answer was correct or incorrect */
class NextButton extends React.Component {
  constructor(props){
    super(props);

    this.next = this.next.bind(this);

  }

  next(){
    let correct = this.props.correct;
    const nextClick = this.props.nextClick;
    nextClick(correct);
  }
  render(){
    let nextClick = this.props.nextClick;
    if (this.props.answered===true){
    if (this.props.correct===true){
      return (<div className='next-block'><span>correct!</span>
      <button className='advance-quiz' onClick={this.next}>next question</button>
      </div>);
    }else{
      return (<div className='next-block'><span>incorrect :(</span>
      <button className='advance-quiz' onClick={this.next}>next question</button>
      </div>);
    }
  }else return null;
}
}

//displays the user's progress in the quiz
function Counter(props){
  let number = props.number;
  return (<h2>question<br/> {number}/10</h2>)
}

//renders the possible answers, passed as props from the App state
function Choices(props){

  const check = props.check;
  const answered = props.answered,
      correct = props.correct,
      nextClick = props.nextClick;
if (answered===true){
  return <NextButton answered={answered} correct={correct} nextClick={nextClick} />
}
if (props.choices===null) return null;
let choices = [];
for (let [key,val] of Object.entries(props.choices)){
  choices.push({letter:key,text:val})
}
choices = choices.map((el,i)=>{
  return <ChoiceBox check={check} key={i} text={el.text} letter={el.letter} />
})
console.log(choices)
return (
  <div id='choices'>
    {choices}
  </div>
)
}


//renders clickable button to select answer
function ChoiceBox(props){
  let letter = props.letter;
  let text = props.text;
  let check = props.check;
  return (
    <button onClick={check} className='choice-box' id={letter}><span>{text}</span></button>
  )
}


/* parent component to all others. this component's state is the 'source of all truth'.
on mount, this component makes a call to the server to initialize it's state
 */
class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      filter : [],
      question: null,
      userid : null,
      status : {
        answered: false,
        correct: false
      },
      number : 1,
      score: 0,
      active: false,
      init: true
    }

    this.updateFilters = this.updateFilters.bind(this);
    this.checkAnswer = this.checkAnswer.bind(this);
    this.nextClick = this.nextClick.bind(this);
    this.tryAgain = this.tryAgain.bind(this);
    this.begin = this.begin.bind(this);
  }

  componentDidMount(){
    this.initData();
  }

  async nextClick(correct){
    const newQ = await this.newQuestion();
    let pt = 0;
    correct===true?pt+=1:pt+=0;
    let num = this.state.number;
    let active = num>9?false:true;
    this.setState(prevState=>{
      return {
        question: newQ,
        status : {answered:false,correct:false},
        number : prevState.number + 1,
        score: prevState.score + pt,
        active: active
      }
    })
    
    

  }

  begin(){
    this.setState({
      init: false,
      active: true
    });
  }

  updateFilters(filters){
   let update = filters.slice();
   this.setState({
     filter: update
   })


  }

  


  async initData(){
    const response = await axios.get('/api/init');
    const userid = response.data.id;
    const initQ = response.data.initQ;

    this.setState({
      userid: userid,
      question : initQ
    })
  }

  async newQuestion(){
    const urlStr = "/api/filter?userid=";
    const userid = this.state.userid;
    let filters = this.state.filter.slice();
    filters = filters.filter(el=>el.selected!==false);
    if (filters.length===0||filters.length===3){
      const response = await axios.get('/api/question/'+userid);
      const newQ = response.data.newQ;
      return newQ;
    }else if (filters.length===1){
     let query =urlStr+userid+ '&filter1='+filters[0].name;
     const response = await axios.get(query)
     .catch(e=>console.log(e));
     const newQ = response.data.newQ;
     console.log(newQ);
     return newQ;
     

    }else if (filters.length===2){
      let query = urlStr+userid+'&filter1='+filters[0].name+'&filter2='+filters[1].name;
      console.log(query);
      const response = await axios.get(query)
      .catch(e=>console.log(e));
      const newQ = response.data.newQ;
      return newQ;
    }
  
}

  getChoices(){
    if (this.state.question===null) return null;
    else return this.state.question.choices;
  }

  async tryAgain(){
    const question = await this.newQuestion();
    this.setState({
      active: true,
      question: question,
      number: 1,
      score: 0,
      init: true
    })
    
  }

  checkAnswer(e){
    let ans = this.state.question.answer;
    let clickId = e.currentTarget.id;
    if (ans===clickId){
      this.setState({
        status: {answered:true,correct:true}
      })

    }else{
      this.setState({
        status: {answered:true,correct:false}
    })

  }
}

  render(){
    let updateFilters = this.updateFilters;
    let selected = this.state.filter;
    let question = this.state.question;
    let choices = this.getChoices();
    let check = this.checkAnswer;
    let answered = this.state.status.answered;
    let correct = this.state.status.correct;
    let nextClick = this.nextClick;
    let active = this.state.active;
    let tryAgain = this.tryAgain;
    let init = this.state.init;
    let begin = this.begin;

    if (init===true){

      return(<div className='main'>
      <header>
      <div><h1>chingu trivia</h1></div>
      <div><Counter number={this.state.number} /></div>
      <div><Topics update={updateFilters} /></div>
      </header>
      <section id='wrapper'>
        <div id='quiz'>
        <InitDisplay begin={begin} />
        </div>
        </section>
        
      </div>)
    }


    if (active===true){
    
    return (<div className='main'>
      <header>
      <div><h1>chingu trivia</h1></div>
      <div><Counter number={this.state.number} /></div>
      <div><Topics update={updateFilters} /></div>
      </header>
      <section id='wrapper'>
        <div id='quiz'>
        <Filters selected={selected} />
        <Question question = {question} />
        <Choices choices = {choices} check={check} answered={answered} correct={correct} nextClick={nextClick} />
        </div>
        </section>
        
      </div>)
    }else if (active===false){
      return(<div className='main'>
      <header>
      <div><h1>chingu trivia</h1></div>
      <div></div>
      <div><Topics update={updateFilters} /></div>
      </header>
      <section id='wrapper'>
        <div id='quiz'>
          <h3>final score:<br/>{this.state.score}/10<br/>{(this.state.score/10*100).toFixed(1)}%</h3>
          <button className='try-again' onClick={this.tryAgain}>try again</button>
        
        </div>
        </section>
        
      </div>)


    }
  }
}



export default App;