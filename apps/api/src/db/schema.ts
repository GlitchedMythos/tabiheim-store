import {
  boolean,
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text('role'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
  activeOrganizationId: text('active_organization_id'),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull(),
  metadata: text('metadata'),
});

export const member = pgTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').default('member').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

// TCG (Trading Card Game) Tables

export const productCategory = pgTable('product_category', {
  categoryId: integer('category_id').primaryKey(), // Static ID from external API
  name: text('name').notNull(),
  displayName: text('display_name'),
  modifiedOn: timestamp('modified_on', { mode: 'date' }),
});

export const productGroup = pgTable('product_group', {
  groupId: integer('group_id').primaryKey(), // Static ID from external API
  name: text('name').notNull(),
  abbreviation: text('abbreviation'),
  isSupplemental: boolean('is_supplemental').default(false),
  publishedOn: timestamp('published_on', { mode: 'date' }),
  modifiedOn: timestamp('modified_on', { mode: 'date' }),
  categoryId: integer('category_id').references(
    () => productCategory.categoryId,
    { onDelete: 'cascade' }
  ),
});

export const product = pgTable('product', {
  productId: integer('product_id').primaryKey(), // Static ID from external API
  name: text('name').notNull(),
  cleanName: text('clean_name'),
  cardNumber: text('card_number'), // Card number - format varies by game (e.g., "003/142" for Pokemon, "OP11-001" for One Piece)
  imageUrl: text('image_url'),
  categoryId: integer('category_id'),
  groupId: integer('group_id')
    .notNull()
    .references(() => productGroup.groupId, { onDelete: 'cascade' }),
  url: text('url'),
  modifiedOn: timestamp('modified_on', { mode: 'date' }),
  imageCount: integer('image_count').default(0),
});

export const presaleInfo = pgTable('presale_info', {
  productId: integer('product_id')
    .primaryKey()
    .references(() => product.productId, { onDelete: 'cascade' }),
  isPresale: boolean('is_presale').default(false).notNull(),
  releasedOn: timestamp('released_on', { mode: 'date' }),
  note: text('note'),
});

export const extendedData = pgTable('extended_data', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => product.productId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  displayName: text('display_name'),
  value: text('value'),
});

export const productSubtype = pgTable('product_subtype', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => product.productId, { onDelete: 'cascade' }),
  subTypeName: text('sub_type_name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  firstSeenAt: timestamp('first_seen_at', { mode: 'date' }),
  lastSeenAt: timestamp('last_seen_at', { mode: 'date' }),
});

export const productPrice = pgTable(
  'product_price',
  {
    id: serial('id'),
    productSubtypeId: integer('product_subtype_id')
      .notNull()
      .references(() => productSubtype.id, { onDelete: 'cascade' }),
    recordedAt: timestamp('recorded_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    lowPrice: numeric('low_price', { precision: 10, scale: 2 }),
    midPrice: numeric('mid_price', { precision: 10, scale: 2 }),
    highPrice: numeric('high_price', { precision: 10, scale: 2 }),
    marketPrice: numeric('market_price', { precision: 10, scale: 2 }),
    directLowPrice: numeric('direct_low_price', {
      precision: 10,
      scale: 2,
    }),
  },
  (table) => [
    // Composite primary key required for TimescaleDB hypertable
    // Must include the partitioning column (recorded_at)
    primaryKey({ columns: [table.id, table.recordedAt] }),
  ]
);
