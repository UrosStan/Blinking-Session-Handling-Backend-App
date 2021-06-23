import express, { Request, Response, Router } from "express";
import { createConnection, getConnection, getRepository } from "typeorm";
import dbConfig from "../config/database";
import { Session, SessionStatus } from "./models/Session";
import { Step, StepType } from "./models/Step";
//import crypto from "express";
const crypto = require("crypto");
import { json } from "body-parser";
import { StepAttempt } from "./models/StepAttempt";
import { StepData } from "./models/StepData";
import {isSessionFinished, validateEmail } from "../config/functions";


const app = express();
app.use(express.json());
const port = 3000 ;
//Connecting to the database
createConnection(dbConfig).then((_connection) => {
      //Namestanje konekcije za sesiju
      const SessionRepository = _connection.getRepository(Session);
      const StepRepository = _connection.getRepository(Step);
      const StepAttemptRepository = _connection.getRepository(StepAttempt);
      const StepDataRepository = _connection.getRepository(StepData);




app.get('/',(req:Request,res:Response, next) => {
    res.send("Working working");
    next();

})
app.get('/',(req:Request,res:Response) => {
  console.log("Nesto");

})

app.post('/createSession',async (req:Request, res:Response,next) => {
//Model for calling create session in Postman

// {"steps":[
//   {
//   "type":"Math"
//   },
//   {
//   "type":"Logic"
//   },
//   {
//   "type":"Logic"
//   },
//   {
//   "type":"Math"
//   },
//   {
//   "type":"Math"
//   }
// ]
// }

  try{
    const newSession = await SessionRepository.create();
    //Setting default values
    newSession.isSuccessful=false;
    newSession.isFinished=false;
    newSession.status=SessionStatus.Created;
    //Generetaing guid
    newSession.sessionId= crypto.randomBytes(16).toString("hex");
    //Saving
    await SessionRepository.save(newSession);
    // res.send(newSession);  

    //Step logic 
    
      try{
        for (var x of req.body.steps){

        
        const newStep = StepRepository.create();
        //Setting default values
        newStep.session=newSession.id;
        newStep.currentAttempt= 0;
        newStep.maxAttempts=2        
        newStep.isFinished=false;
        newStep.isSuccessful=false;
         if(x.type == "Math") {
           newStep.type=StepType.Math;
            
         } 

         else newStep.type=StepType.Logic;

        newStep.data="-1";
       
        //Saving
        await StepRepository.save(newStep);
        //res.send(newStep);  
      }
        
      }catch(err){
        console.log(err);
        return res.status(500).json(err);
      }
  
  
      
   
  }catch(err){
    console.log(err);
    return res.status(500).json(err);
  }
  
    // next();
   res.send("Uspesno snimljeno");  
});


app.post('/finishStep',async(req:Request, res:Response) => {
 //How to test in postman
//  {
//   "sessionId": 42,
//   "stepId": 24,
//   "payload": 4
// }


//Ne zaboravi sa session da namestis funkciju da vidis da li se zatvara
  const {sessionId,stepId,payload} = req.body;
      
      


      const Session = await SessionRepository.findOne(sessionId);
      const Step = await StepRepository.findOne(stepId);
      //res.send(Step);
      
      //Provera da li smo dobre id-jeve dali
      if(Session == null || Step == null) return res.send("Greska");


      if(Session.status=="Completed")return res.send("Vec smo zavrsili sesiju");
      //provera da li smo zavrsili step
      if(Step.isFinished==true)return res.send("Vec je zavrsen step");
  
      if(Step.maxAttempts-Step.currentAttempt<=0){
        Step.isFinished=true;
        return res.send("Iskoriscen je maksimalan broj pokusaja");
      }

      //Svaku proveru i upisivanje radimo i sa StepAttemptom, za pocetak sesiju stavljamo na InProgress ako nije
      if(Session.status=="Created")Session.status=SessionStatus.InProgress;

      const newStepAttempt= await StepAttemptRepository.create();

      //Ako ne postoji stepData
      let newStepData;
      if(Session.stepData==null){
      newStepData= await StepDataRepository.create();
      Session.stepData=newStepData.id;
      }else{
        //Ako postoji stepData
        newStepData = await StepDataRepository.findOne(Session.stepData);
      }

      //Ovo ce se desiti u svakom koraku
      newStepAttempt.step=Step.id;
      newStepAttempt.data=payload;
      Step.currentAttempt++;
      Step.data=payload;

    
      

      //Ovde krecemo sa logikom
      if(Step.type == "Math"){
        //Cim je math, odmah punimo StepData
        newStepData!.mathData=payload;
        await StepDataRepository.save(newStepData!);

        //Math logika
        if(payload==4){
          //Uspeh
          //Zatvaramo step attempt
          newStepAttempt.isSuccessful=true;
          await StepAttemptRepository.save(newStepAttempt);

          //Zatvaramo step
          Step.isSuccessful = true;
          Step.isFinished = true;
          await StepRepository.save(Step);

         
          
          //Session pozivamo da vidimo jel on kompletno gotov, idemo search za sve stepove koji su finished 
        
        }else{
          //Neuspeh math payload
          //Zatvaramo StepAttempt
          newStepAttempt.isSuccessful=false;
          await StepAttemptRepository.save(newStepAttempt);
          
          //Zatvaramo Step
          Step.isSuccessful=false;
          //Provera da vidimo da li cemo ga zauvek zatvoriti
          if(Step.maxAttempts-Step.currentAttempt<=0){
            Step.isFinished = true;

          }else Step.isFinished = false;
          await StepRepository.save(Step);
          
        }
      }
      else {
        //Logic logika
        //Zatvaranje stepData
        newStepData!.logicData=payload;
        await StepDataRepository.save(newStepData!);
        //Checking to see if the email is valid
        const validEmail:boolean = validateEmail(payload);

        if(validEmail){
          //If Logic passes
          //Zatvaramo stepAttempt
          newStepAttempt.isSuccessful=true;
          await StepAttemptRepository.save(newStepAttempt);

          //Zatvaramo step
          Step.isSuccessful = true;
          Step.isFinished = true;
          await StepRepository.save(Step);

        }
        else{
          //If Logic fails
          //Zatvaramo StepAttempt
          newStepAttempt.isSuccessful=false;
          await StepAttemptRepository.save(newStepAttempt);

         //Zatvaramo Step
         Step.isSuccessful=false;
         //Provera da vidimo da li cemo ga zauvek zatvoriti
         if(Step.maxAttempts-Step.currentAttempt<=0){
           Step.isFinished = true;
           
         }else Step.isFinished = false;
         await StepRepository.save(Step);
         

        }

      }
        //Setting up queries for Searching for steps of session
        const filterObject: any = {};
        filterObject.session = Session.id;
        filterObject.isFinished = false;
        
        const findObject: any = { where: filterObject }
        const stepsConditions = await StepRepository.find(findObject);
        //Check if returned something
        if(Object.keys(stepsConditions).length)res.send("Jos ima nedovrsenih koraka za ovu sesiju");
        else {
          //Nema onih koji nisu finished, znaci svi su finished, sesija je prosla i successfull 
          //Session.finishedAt = new Date();
          Session.isFinished = true;
          Session.status = SessionStatus.Completed;
          Session.isSuccessful=true;
        }
  //Uzmemo taj trazeni step, proveravamo da li je sessija na created, odmah je bacamo na InProgress
  //Ako sve prodje
  //Utvrdimo tip stepa(mozemo prikazati poruku korisnku) i ubacimo payload u odgovarajucu funkciju, Math ili Logic, prosledimo i id step-a 
  
  //U funkciji proverimo da li je Step Finished prvo, ubelezimo stepAttempt u bazi sa rezultatom i vrednost koja je to generisala
  //Ako je uspesan stepAtempt onda stavljamo i sam StepAttempt i Step kao uspesan o ipisujemo rezultate data

      //Imamo funkciju koja Proverava da li je ostalo jos koraka u session-u, 
      //ako nije ostalo jos koraka onda stavljamo session kao uspesan ako su svi stepovi gotovi i uspesni

      //Takodje moramo imati funkciju koja ce se pozivati posle svakog gotovog step-a da azurira stepData
      //Poziva se i posle uspesnog i neuspesnog gotovog step-a

  //Ako je neuspesan stepAttempt onda belezimo stepAttempt u bazi i damo korisniku opet da pokusa ukoliko moze
  //Ukoliko ne moze, zatvaramo step, pisemo rezultat poslednje vrednosti iz neuspesnog step-a
  // i pozivamo funkciju da vidimo da li zatvaramo session(da li je ostalo jos notFinished koraka)

  //Napisati regex za logic
});
 
  app.get('/getSessions/',async (req:Request, res:Response) => {
      //res.send("Ovde idu sesije");
      //Return all sessions
     
      //Basic querys
      //All sessions
      const sessions = await SessionRepository.find();
      res.json(sessions);

      //Find one
      // const oneSession = await SessionRepository.findOne(req.params.id);
      // res.json(oneSession);

    
    });
  

    // //Uncomment for testing purposes
    // app.get('/test/',async (req:Request, res:Response) => {
    //   // const result = validateEmail("uross12312@@gmail.com");
    //   // res.send(result);
    //   //filterObject.isSuccessful = false;
    //   //Setting up queries for Searching for steps of session
    //   const filterObject: any = {};
    //   filterObject.session = 148;
    //   filterObject.isFinished = true;
    //   const findObject: any = { where: filterObject }
    //   const stepsConditions = await StepRepository.find(findObject);
    //   if(Object.keys(stepsConditions).length)res.json(stepsConditions);
    //   else res.send("Prazan");
      
    
    // });
 
  
  //Settings for server
  app.listen(port); 

  
});