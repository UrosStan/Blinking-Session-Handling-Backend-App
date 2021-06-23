import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn} from "typeorm";

@Entity()
export class StepData {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({nullable:true})
    mathData!: string;

    @Column({nullable:true})
    logicData!: string;

}