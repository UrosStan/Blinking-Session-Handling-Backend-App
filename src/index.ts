import express, { Request, Response, Router } from "express";
import { createConnection, getConnection, getRepository, LessThan, MoreThan } from "typeorm";
import dbConfig from "../config/database";
import { Session, SessionStatus } from "./models/Session";
import { Step, StepType } from "./models/Step";
//import crypto from "express";
const crypto = require("crypto");
import { json } from "body-parser";
import { StepAttempt } from "./models/StepAttempt";
import { StepData } from "./models/StepData";
import {validateEmail } from "../config/functions";


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

app.post('/createSession',async (req:Request, res:Response,next) => {
//JSON Model for calling create session

// {"steps":[
//   {
//   "type":"Math"
//   },
//   {
//   "type":"Logic"
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
   res.status(201).send("Uspešno kreirana sesija sa koracima");  
});


app.post('/finishStep',async(req:Request, res:Response) => {

 //JSON format for running
//  {
//   "sessionId": 42,
//   "stepId": 24,
//   "payload": 4
// }

  const {sessionId,stepId,payload} = req.body;
      
      const Session = await SessionRepository.findOne(sessionId);
      const Step = await StepRepository.findOne(stepId);
      
      //Provera da li smo dobre id-jeve dali
      if(Session == null || Step == null) return res.status(500).send("Ne postoje entiteti sa traženim id-jevima");

      if(Session.status=="Completed")return res.send("Već je završena tražena sesija");
      //provera da li smo zavrsili korak
      if(Step.isFinished==true)return res.send("Već je završen korak");
  
      if(Step.maxAttempts-Step.currentAttempt<=0){
        Step.isFinished=true;
        return res.send("Iskorisćen je maksimalan broj pokušaja");
      }

      //Svaku proveru i upisivanje radimo i sa StepAttemptom, za pocetak sesiju stavljamo na InProgress ako nije
      if(Session.status=="Created")Session.status=SessionStatus.InProgress;

      const newStepAttempt= await StepAttemptRepository.create();

      //Ako ne postoji stepData
      let newStepData;
      if(Session.stepData!=null){
      //Ako postoji stepData
        try{
        newStepData = await StepDataRepository.findOne(Session.stepData);
        
        // Session.stepData = newStepData!.id;
        }catch(err){
          console.log(err);
        return res.status(500).json(err);
        }
      }else{
      newStepData= await StepDataRepository.create();
      Session.stepData=newStepData.id;
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
        
        //Fetching the id after saving it and putting it in session column
        const newstepDataId =await StepDataRepository.save(newStepData!);
        Session.stepData = newstepDataId.id;

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
          //Zatvaramo session
          await SessionRepository.save(Session);


          }else{
          //Neuspeh math payload
          //Zatvaramo StepAttempt
          newStepAttempt.isSuccessful=false;
          await StepAttemptRepository.save(newStepAttempt);
          
         
          //Provera da vidimo da li cemo ga zauvek zatvoriti
          if(Step.maxAttempts-Step.currentAttempt<=0){
              //Zatvaramo Step
              Step.isFinished = true;
              Step.isSuccessful=false;
              //Ako se zatvori step koji nije succesful onda cela sessija nije succesful
              Session.finishedAt = new Date();
              Session.isFinished = true;
              Session.status = SessionStatus.Completed;
              Session.isSuccessful=false;
              await SessionRepository.save(Session);
              await StepRepository.save(Step);
              return res.status(201).send("Korak i cela sesija su neuspešni");

           }else Step.isFinished = false;
           await StepRepository.save(Step);
          
        }
      }
    else {
      //Logic logika
      //Zatvaranje stepData
      newStepData!.logicData=payload;
      //Fetching the id after saving it and putting it in session column
      const newstepDataId =await StepDataRepository.save(newStepData!);
      Session.stepData = newstepDataId.id;
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
              //Ako se zatvori step koji nije succesful onda cela sessija nije succesful
              Session.finishedAt = new Date();
              Session.isFinished = true;
              Session.status = SessionStatus.Completed;
              Session.isSuccessful=false;
              await SessionRepository.save(Session);
              await StepRepository.save(Step);
              return res.status(201).send("Korak i cela sesija su neuspešni");

          }
           else Step.isFinished = false;
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
        if(Object.keys(stepsConditions).length)res.status(201).send("Uspešno snimljen korak, još uvek ima nedovršenih koraka za ovu sesiju");
        else {
          //Nema onih koji nisu finished, znaci svi su finished, sesija je prosla i successfull 
          //Jer cemo staviti sessiju na completed i not succesful cim se jedan korak pogresi
          Session.finishedAt = new Date();
          Session.isFinished = true;
          Session.status = SessionStatus.Completed;
          Session.isSuccessful=true;
          await SessionRepository.save(Session);
          return res.status(201).send("Korak i cela sesija su uspešni");

        }
        await SessionRepository.save(Session);

});
 
  app.post('/getSessions',async (req:Request, res:Response) => {

    //Json example
    // {
    //   "dateFrom": "2021-06-24",
    //   "dateTill": "2022-07-15",
    //    "status": "Completed",  
    //   "isSuccessful": true,  
    //   "isFInished":true
    //  }


    const filter: any = {};
    //Check for params in body, and just add them to query with where 
    
    if (req.body.status) filter.status = req.body.status;
    if (req.body.isSuccessful) filter.isSuccessful = req.body.isSuccessful;
    if (req.body.isFinished) filter.isFinished = req.body.isFinished;
    //For dates use "2021-07-15" format
    if (req.body.dateFrom) filter.createdAt = MoreThan(req.body.dateFrom);
    if (req.body.dateTo) filter.createdAt = LessThan(req.body.dateTo);
    
    const find: any = { where: filter };
    //Koriscenje skipa i take-a za paginaciju
    if (req.body.skip) find.skip = req.body.skip;
    if (req.body.take) find.take = req.body.take;

    const sessions = await SessionRepository.find(find);

    res.json(sessions);
    
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