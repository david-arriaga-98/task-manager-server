import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	BaseEntity,
	ManyToOne,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
	ManyToMany,
	JoinTable
} from 'typeorm';
import { Franchise } from './Franchise';
import { Task } from './Task';
import { User } from './User';

@Entity()
export class Group extends BaseEntity {
	@PrimaryGeneratedColumn()
	public id!: number;

	@Column({ length: 80 })
	public name!: string;

	@Column({ length: 225 })
	public description!: string;

	@CreateDateColumn()
	public readonly createdAt!: Date;

	@UpdateDateColumn()
	public readonly updatedAt!: Date;

	/** Relations */
	@ManyToOne(() => Franchise, (franchise) => franchise.groups)
	public franchise!: Franchise;

	@ManyToOne(() => User, (user) => user.groups)
	public groupOwner!: User;

	@OneToMany(() => Task, (task) => task.group)
	public tasks!: Task[];

	@ManyToMany((type) => User, (user) => user.groups)
	public users!: User[];
}
