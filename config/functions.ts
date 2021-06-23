import { Repository } from "typeorm";
import { Step } from "../src/models/Step";

export function validateEmail(email:string) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

export async function isSessionFinished(StepRepository:Repository <Step>){
    const filterObject: any = {};
      filterObject.session = 446;
      const findObject: any = { where: filterObject }
      

      const steps = await StepRepository.find(findObject);
      if(steps==null)return false;
      return true;
}