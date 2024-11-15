/**
 * Human Tasks:
 * 1. Configure bcrypt salt rounds in environment variables (BCRYPT_SALT_ROUNDS)
 * 2. Set up database indexes for email and id columns
 * 3. Configure Supabase row level security policies for user table
 * 4. Set up audit logging for sensitive operations
 */

// @ts-ignore bcrypt v5.0.1
import * as bcrypt from 'bcrypt';
// @ts-ignore @supabase/supabase-js v2.0.0
import { SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../../../types/user';
import { AuthErrorCode } from '../../../types/auth';

/**
 * Database model class for user management with CRUD operations
 * Implements requirements:
 * - User Management: Profile customization and tracking
 * - Authorization Levels: Role-based access control
 * - Data Security: Secure password handling and data protection
 */
export class UserModel {
  private readonly db: SupabaseClient;
  private readonly tableName: string = 'users';
  private readonly saltRounds: number = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

  constructor(db: SupabaseClient) {
    this.db = db;
  }

  /**
   * Create a new user record with encrypted password
   * Requirement: User Management - Profile creation and customization
   */
  async create(userData: Partial<UserProfile>): Promise<UserProfile> {
    // Validate required fields
    if (!userData.email || !userData.passwordHash) {
      throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
    }

    // Check for existing user
    const { data: existingUser } = await this.db
      .from(this.tableName)
      .select('email')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.passwordHash, this.saltRounds);

    // Prepare user data with defaults
    const newUser: Partial<UserProfile> = {
      ...userData,
      passwordHash,
      role: userData.role || 'FREE_USER',
      status: userData.status || 'ACTIVE',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: userData.preferences || {},
    };

    // Insert user record
    const { data: createdUser, error } = await this.db
      .from(this.tableName)
      .insert(newUser)
      .select('id, email, role, status, createdAt, lastLoginAt, preferences')
      .single();

    if (error) {
      throw error;
    }

    return createdUser as UserProfile;
  }

  /**
   * Retrieve user by ID
   * Requirement: User Management - Profile access and verification
   */
  async findById(id: string): Promise<UserProfile | null> {
    const { data: user, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return null;
    }

    return user as UserProfile;
  }

  /**
   * Retrieve user by email address
   * Requirement: User Management - User lookup and authentication
   */
  async findByEmail(email: string): Promise<UserProfile | null> {
    const { data: user, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return null;
    }

    return user as UserProfile;
  }

  /**
   * Update user profile data
   * Requirement: User Management - Profile customization and updates
   */
  async update(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    // Handle password updates
    if (updates.passwordHash) {
      updates.passwordHash = await bcrypt.hash(updates.passwordHash, this.saltRounds);
    }

    // Remove sensitive fields from updates if present
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.createdAt;

    const { data: updatedUser, error } = await this.db
      .from(this.tableName)
      .update({
        ...safeUpdates,
        updatedAt: new Date(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return updatedUser as UserProfile;
  }

  /**
   * Soft delete user by setting status to DELETED
   * Requirement: Data Security - Maintain user data for audit purposes
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .update({
        status: 'DELETED',
        updatedAt: new Date(),
      })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Verify user password against stored hash
   * Requirement: Data Security - Secure password verification
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error(AuthErrorCode.INVALID_CREDENTIALS);
    }
  }
}