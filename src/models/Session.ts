import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToOne,
    JoinColumn,
    OneToMany
  } from "typeorm";

import {StepData} from "./StepData";
import {Step} from "./Step";
  
//Inicilization of session statuses for enum 
export enum SessionStatus {
    Created = "Created",
    InProgress = "InProgress",
    Completed = "Completed"
}

  @Entity()
  export class Session {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Column()
    sessionId!: string;
  
    @CreateDateColumn()
    createdAt!: Date;

    @Column({ nullable: true })
    finishedAt!: Date;
  
    @Column({
        type: "enum",
        enum: SessionStatus
    })
    status!: SessionStatus
  
    @Column()
    isSuccessful!: boolean;

    @Column()
    isFinished!: boolean;

    @OneToOne(() => StepData)
    @JoinColumn()
    stepData!: number;

    @OneToMany(() => Step, step => step.session)
    steps!: Step[];

  }