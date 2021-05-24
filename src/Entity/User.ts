import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	BaseEntity,
	ManyToOne,
	ManyToMany,
	JoinTable,
	OneToMany
} from 'typeorm';
import { comparePassword, encryptPassword } from '../Utils/ManagePassword';
import { Franchise } from './Franchise';
import { Group } from './Group';
import { Task } from './Task';

@Entity()
export class User extends BaseEntity {
	@PrimaryGeneratedColumn()
	public id!: number;

	@Column({ length: 80 })
	public names!: string;

	@Column({ length: 35 })
	public username!: string;

	@Column({ length: 100 })
	public email!: string;

	@Column({ length: 90, select: false })
	public password!: string;

	@Column({ length: 25 })
	public role!: string;

	@CreateDateColumn()
	public readonly createdAt!: Date;

	@UpdateDateColumn({ select: false })
	public readonly updatedAt!: Date;

	/** Relations */
	@ManyToOne(() => Franchise, (franchise) => franchise.users)
	public franchise!: Franchise;

	@ManyToMany((type) => Task, (task) => task.users)
	@JoinTable()
	public tasks!: Task[];

	@ManyToMany((type) => Group, (group) => group.users)
	@JoinTable()
	public groups!: Group[];

	@OneToMany(() => Group, (group) => group.groupOwner)
	public groupsOfTheOwner!: Group[];

	/** Methods */

	public async encryptPassword(password: string): Promise<string> {
		return await encryptPassword(password);
	}

	public async comparePassword(password: string): Promise<boolean> {
		return await comparePassword(password, this.password);
	}
}
