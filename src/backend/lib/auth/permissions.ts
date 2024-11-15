/**
 * Role-based access control and permission management implementation
 * Addresses the following requirements:
 * - Authorization Levels (8.1.2): Role-based access control for Anonymous, Free User, Paid User, and Admin roles
 * - Security Controls (8.3.6): Permission validation and access control mechanisms
 */

import { UserRole, UserProfile } from '../../types/user';
import { JWTPayload } from '../../types/auth';

// Resource types that require permission checks
export type ResourceType = 'drill' | 'simulation' | 'profile' | 'subscription' | 'admin';

// Available actions on protected resources
export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'execute';

// Combined permission format (e.g., "drill:read", "profile:update")
export type Permission = `${ResourceType}:${PermissionAction}`;

// Permission check parameters interface
export interface PermissionCheck {
  role: UserRole;
  requiredPermission: Permission;
  userId?: string;
  resourceId?: string;
}

// Permission configuration by role interface
interface PermissionConfig {
  rolePermissions: Record<UserRole, Permission[]>;
}

/**
 * Default permission configuration for each role
 * Requirement: Authorization Levels - Hierarchical access control
 */
const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  ANONYMOUS: [
    'drill:read',
    'simulation:read',
  ],
  FREE_USER: [
    'drill:read',
    'drill:execute',
    'simulation:read',
    'simulation:execute',
    'profile:read',
    'profile:update',
  ],
  PAID_USER: [
    'drill:read',
    'drill:execute',
    'drill:create',
    'simulation:read',
    'simulation:execute',
    'simulation:create',
    'profile:read',
    'profile:update',
    'subscription:read',
    'subscription:update',
  ],
  ADMIN: [
    'drill:read',
    'drill:create',
    'drill:update',
    'drill:delete',
    'drill:execute',
    'simulation:read',
    'simulation:create',
    'simulation:update',
    'simulation:delete',
    'simulation:execute',
    'profile:read',
    'profile:create',
    'profile:update',
    'profile:delete',
    'subscription:read',
    'subscription:create',
    'subscription:update',
    'subscription:delete',
    'admin:read',
    'admin:create',
    'admin:update',
    'admin:delete',
    'admin:execute',
  ],
};

/**
 * Checks if a user role has a specific permission
 * Requirement: Security Controls - Permission validation
 */
export function hasPermission(check: PermissionCheck): boolean {
  const { role, requiredPermission, userId, resourceId } = check;

  // Validate input parameters
  if (!role || !requiredPermission) {
    return false;
  }

  // Get permissions for the user role
  const rolePermissions = DEFAULT_PERMISSIONS[role] || [];

  // Check if the required permission exists in role permissions
  const hasDirectPermission = rolePermissions.includes(requiredPermission);

  // Special case: Users can always access their own profile and subscription
  if (!hasDirectPermission && userId && resourceId) {
    const [resourceType] = requiredPermission.split(':') as [ResourceType];
    if ((resourceType === 'profile' || resourceType === 'subscription') && userId === resourceId) {
      return true;
    }
  }

  return hasDirectPermission;
}

/**
 * Validates permission and throws error if not allowed
 * Requirement: Security Controls - Access control enforcement
 */
export function validatePermission(check: PermissionCheck): void {
  if (!hasPermission(check)) {
    throw new Error('INSUFFICIENT_PERMISSIONS');
  }
}

/**
 * Gets all permissions for a specific user role
 * Requirement: Authorization Levels - Role-based permissions
 */
export function getRolePermissions(role: UserRole): Permission[] {
  // Validate role parameter
  if (!DEFAULT_PERMISSIONS[role]) {
    return [];
  }

  // Get permissions for the role including inherited permissions
  const permissions = new Set<Permission>();

  // Add role-specific permissions
  DEFAULT_PERMISSIONS[role].forEach(permission => permissions.add(permission));

  // Inherit permissions based on role hierarchy
  switch (role) {
    case 'ADMIN':
      DEFAULT_PERMISSIONS['PAID_USER'].forEach(permission => permissions.add(permission));
      // falls through
    case 'PAID_USER':
      DEFAULT_PERMISSIONS['FREE_USER'].forEach(permission => permissions.add(permission));
      // falls through
    case 'FREE_USER':
      DEFAULT_PERMISSIONS['ANONYMOUS'].forEach(permission => permissions.add(permission));
      break;
  }

  return Array.from(permissions);
}

// Export types for external use
export { ResourceType, PermissionAction, PermissionCheck };