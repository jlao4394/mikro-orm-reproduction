import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id: number;

  @PrimaryKey()
  email: string;

  @OneToMany(() => Post, post => post.user)
  posts = new Collection<Post>(this);

  constructor(id: number, email: string) {
    this.id = id;
    this.email = email;
  }
}

@Entity()
class Post {
  @PrimaryKey()
  id: number;

  @ManyToOne(() => User, { primary: true })
  user: User;

  @OneToMany(() => Comment, comment => comment.post)
  comments = new Collection<Comment>(this);

  constructor(id: number, user: User) {
    this.id = id;
    this.user = user;
  }
}

@Entity()
class Comment {
  @PrimaryKey()
  id: number;

  @ManyToOne(() => Post, { primary: true })
  post: Post;

  @OneToMany(() => Tag, tag => tag.comment)
  tags = new Collection<Tag>(this);

  constructor(id: number, post: Post) {
    this.id = id;
    this.post = post;
  }
}

@Entity()
class Tag {
  @PrimaryKey()
  id: number;

  @ManyToOne(() => Comment, { primary: true })
  comment: Comment;

  constructor(id: number, comment: Comment) {
    this.id = id;
    this.comment = comment;
  }
}

let orm: MikroORM;

beforeEach(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Post, Comment, Tag],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterEach(async () => {
  await orm.close(true);
});

test('create', async () => {
  // Create a user with the full graph in a single create call
  orm.em.create(User, {
    id: 1,
    email: 'john@example.com',
    posts: [
      {
        id: 1,
        comments: [
          {
            id: 1,
            tags: [
              { id: 1 },
              { id: 2 }
            ]
          },
          {
            id: 2,
            tags: [
              { id: 3 }
            ]
          }
        ]
      },
      {
        id: 2,
        comments: [
          {
            id: 3,
            tags: [
              { id: 4 },
              { id: 5 }
            ]
          }
        ]
      }
    ]
  });
  
  await orm.em.flush();
});

test('assign', async () => {
  const user = orm.em.create(User, {
    id: 1,
    email: 'john@example.com',
    posts: []
  });
  
  await orm.em.flush();

  orm.em.assign(user, {
    id: 1,
    email: 'john@example.com',
    posts: [
      {
        id: 1,
        comments: [
          {
            id: 1,
            tags: [
              { id: 1 },
              { id: 2 }
            ]
          },
          {
            id: 2,
            tags: [
              { id: 3 }
            ]
          }
        ]
      },
      {
        id: 2,
        comments: [
          {
            id: 3,
            tags: [
              { id: 4 },
              { id: 5 }
            ]
          }
        ]
      }
    ]
  })

  await orm.em.flush();
});
