// Loose record types that replace the old `@prisma/client` model types.
// The data layer is Mongoose now, so these are plain JSON-shaped records.
export type Appointments = Record<string, any>;
export type Patient = Record<string, any>;
export type Doctor = Record<string, any>;
export type Favourites = Record<string, any>;
export type Blogs = Record<string, any>;
export type Reviews = Record<string, any>;
export type Medicine = Record<string, any>;
export type Prescription = Record<string, any>;
