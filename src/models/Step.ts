import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, OneToMany} from "typeorm";
import {Session} from "./Session";
import { StepAttempt } from "./StepAttempt";

export enum StepType {
    Math ,
    Logic
}
//Moram da vidim sta cu raditi sa ovim, da li ostaviti data kao string? Trebalo bi da radi posao
// const data={
//  mathData: null,
//  logicData: null
// }; 

@Entity()
export class Step {
   
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: "enum",
        enum: StepType
    })
    type!: StepType

    @Column()
    isSuccessful!: boolean;

    @Column()
    isFinished!: boolean;

    @Column()
    data!: string;

    @Column()
    maxAttempts!: number;

    @Column()
    currentAttempt!: number;

    @ManyToOne(() => Session, session => session.steps)
    session!: number;

    @OneToMany(() => StepAttempt, stepAttempt => stepAttempt.step)
    stepAttempts!: StepAttempt[];



}