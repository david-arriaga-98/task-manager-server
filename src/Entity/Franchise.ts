import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	BaseEntity,
	OneToMany
} from 'typeorm';
import { Group } from './Group';
import { User } from './User';

@Entity()
export class Franchise extends BaseEntity {
	@PrimaryGeneratedColumn()
	public id!: number;

	@Column({ length: 80 })
	public name!: string;

	@Column({ length: 150 })
	public socialReason!: string;

	@CreateDateColumn()
	public readonly createdAt!: Date;

	@UpdateDateColumn({ select: false })
	public readonly updatedAt!: Date;

	/** Relations */
	@OneToMany(() => User, (user) => user.franchise)
	public users!: User[];

	@OneToMany(() => Group, (group) => group.franchise)
	public groups!: Group[];
}
