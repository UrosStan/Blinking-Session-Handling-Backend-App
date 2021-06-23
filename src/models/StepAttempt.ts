import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne} from "typeorm";
import { Step } from "./Step";

@Entity()
export class StepAttempt {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    isSuccessful!: boolean;

    @Column({nullable:true})
    data!: string;

    @ManyToOne(() => Step, step => step.stepAttempts)
    step!: number;

}