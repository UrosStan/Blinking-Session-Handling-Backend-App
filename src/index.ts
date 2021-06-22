import express, { Request, Response, Router } from "express";
import { createConnection, getConnection, getRepository } from "typeorm";
import dbConfig from "../config/database";
import { Session, SessionStatus } from "./models/Session";
  


const app = express();
// app.use(express.json());

const port = 3000 ;
//Connecting to the database
createConnection(dbConfig).then((_connection) => {
  
      //Namestanje konekcije za sesiju
      const SessionRepository = _connection.getRepository(Session);



app.get('/',(req:Request,res:Response, next) => {
    res.send("Working working");
    next();

})
app.get('/',(req:Request,res:Response) => {
  console.log("Nesto");

})

app.post('/createSession',async (req:Request, res:Response) => {
    
    const newSession = await SessionRepository.create();
    //Setting default values
    newSession.isFinished=false;
    newSession.isSuccessful=false;
    newSession.status=SessionStatus.Created;
    //Generetaing guid
    const crypto = require("crypto");
    newSession.sessionId= crypto.randomBytes(16).toString("hex");
   

 

    const results = await SessionRepository.save(newSession);
    res.send(newSession);  

  //Znaci dobijamo niz koraka kao argument sesije, tipa niz []= {Math (blabla), Logic(blabla), Math(..), (Math..)}
  //A same paylode idu kroz finish step
  //Treba da vidim kako cu napraviti ovaj niz, vrv neki associative array?
  //Edit, cek znaci ovde ne idu payload nego samo tipovi koraka
  
  //Ovde cemo generisati guid, video sam da ima neka fora sa express-session ovde gde bukvalno imas funkciju za ovo, da ne pravim sam
  //Automatski stavljamo session status u Created 
  //Finished at na null
  //Is succesful false
  //Is finished false
  // Max attempt na 2, video sam foru sa express-sessionn gde se pravi promenljiva req.session.AttemptNumver tipa i vezan je za sesiju ovu, tako?
  //Neka funkcija koja ce proveriti da li u nizu imamo i vrednost Math i vrednost Logic jer mora imati obe vrednosti

  //Ahaaaa ovde mogu zavrsiti createSession i tjt
   
   //Cek znaci mi smo trebali da sve stepove upisemo u tabelu step odmah iz niza u funkciji create

})

app.get('/finishStep',(req:Request, res:Response) => {
  res.send("Nesto nesto");

 //A bukvalno ovaj payload ce biti neki broj tipa Math(4) ili Logic(email@gmail.com)
 //Ovo math i logic mozda mogu u get da postavim? tipa ?Math=3&Logic="bla@gmail.com" Mozda ne jer ce se slati priv info? Bolje post

 //Znaci metoda finishstep prima tri parametra {session id, id koraka, payload } 
 //Cek znaci mi smo trebali da sve stepove upisemo u tabelu step odmah iz niza u funkciji create
 //Znaci ovde uzmemo sve stepove tjst. vratimo step sa id-jem koji smo dobili prilikom pozivanja finishstep, posto ona prima id koraka
 //Proverimo da li je finished i na kom je attemptu 
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



})
 
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
  

  
  //Settings for server
  app.listen(port);

  
});