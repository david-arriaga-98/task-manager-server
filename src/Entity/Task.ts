import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	BaseEntity,
	ManyToOne,
	UpdateDateColumn,
	CreateDateColumn,
	ManyToMany
} from 'typeorm';
import { Group } from './Group';
import { User } from './User';

@Entity()
export class Task extends BaseEntity {
	@PrimaryGeneratedColumn()
	public id!: number;

	@Column({ length: 80 })
	public name!: string;

	@Column({ length: 225 })
	public description!: string;

	@Column({ length: 25 })
	public status!: string;

	@Column('datetime')
	public endTask!: Date;

	@CreateDateColumn()
	public readonly createdAt!: Date;

	@UpdateDateColumn()
	public readonly updatedAt!: Date;

	/** Relations */
	@ManyToOne(() => Group, (group) => group.tasks)
	public group!: Group;

	@ManyToMany(() => User, (user) => user.tasks)
	public users!: User[];
}
