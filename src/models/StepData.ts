import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn} from "typeorm";

@Entity()
export class StepData {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    mathData!: string;

    @Column()
    logicData!: string;

}