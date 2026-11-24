import express from 'express';
import { auth, authorize, requireAnyPermission } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/adminController.js';
import * as permCtrl from '../controllers/permissionController.js';
import * as roleCtrl from '../controllers/roleController.js';
import News from '../models/News.js';
import Service from '../models/Service.js';
import Alert from '../models/Alert.js';
import Station from '../models/Station.js';
import SafetyDocument from '../models/SafetyDocument.js';
import Vacancy from '../models/Vacancy.js';

const router = express.Router();

router.use(auth);

const genericRoutes = [
  { path: 'news', model: News },
  { path: 'services', model: Service },
  { path: 'alerts', model: Alert },
  { path: 'stations', model: Station },
  { path: 'documents', model: SafetyDocument },
  { path: 'vacancies', model: Vacancy }
];

genericRoutes.forEach(({ path, model }) => {
  const controller = ctrl.createGenericController(model, path);
  router.get(`/${path}`, requireAnyPermission(['content:read', `${path}.view`]), controller.getAll);
  router.post(`/${path}`, requireAnyPermission(['content:write', `${path}.create`, `${path}.manage`]), controller.create);
  router.put(`/${path}/:id`, requireAnyPermission(['content:write', `${path}.edit`, `${path}.manage`]), controller.update);
  router.delete(`/${path}/:id`, requireAnyPermission(['content:write', `${path}.delete`, `${path}.manage`]), controller.delete);
});

router.get('/requests', requireAnyPermission(['submissions:manage', 'submissions.view', 'submissions.manage']), ctrl.getRequests);
router.delete('/requests/contact/:id', requireAnyPermission(['submissions:manage', 'submissions.manage']), ctrl.deleteContactMessage);
router.delete('/requests/service/:id', requireAnyPermission(['submissions:manage', 'submissions.manage']), ctrl.deleteServiceRequest);
router.delete('/requests/recruitment/:id', requireAnyPermission(['submissions:manage', 'submissions.manage']), ctrl.deleteRecruitment);
router.delete('/requests/community/:id', requireAnyPermission(['submissions:manage', 'submissions.manage']), ctrl.deleteCommunityRegistration);

/* Dynamic Permission Management */
router.get('/permissions', requireAnyPermission(['permissions:manage', 'users:manage']), permCtrl.getPermissions);
router.post('/permissions', requireAnyPermission(['permissions:manage', 'users:manage']), permCtrl.createPermission);
router.put('/permissions/:id', requireAnyPermission(['permissions:manage', 'users:manage']), permCtrl.updatePermission);
router.delete('/permissions/:id', requireAnyPermission(['permissions:manage', 'users:manage']), permCtrl.deletePermission);

/* Dynamic Role Management */
router.get('/roles', requireAnyPermission(['users:manage', 'roles.view', 'permissions:manage']), roleCtrl.getRoles);
router.post('/roles', requireAnyPermission(['users:manage', 'roles.create', 'permissions:manage']), roleCtrl.createRole);
router.put('/roles/:id', requireAnyPermission(['users:manage', 'roles.edit', 'permissions:manage']), roleCtrl.updateRole);
router.delete('/roles/:id', requireAnyPermission(['users:manage', 'roles.delete', 'permissions:manage']), roleCtrl.deleteRole);

/* User Management */
router.get('/users', requireAnyPermission(['users:manage', 'users.view']), ctrl.getUsers);
router.post('/users', requireAnyPermission(['users:manage', 'users.create']), ctrl.createUser);
router.put('/users/:id', requireAnyPermission(['users:manage', 'users.edit']), ctrl.updateUser);
router.patch('/users/:id/role', requireAnyPermission(['users:manage', 'users.assign_role']), ctrl.updateUserRole);
router.patch('/users/:id/status', requireAnyPermission(['users:manage', 'users.edit']), ctrl.updateUserStatus);
router.delete('/users/:id', requireAnyPermission(['users:manage', 'users.delete']), ctrl.deleteUser);

/* Emergency Hotlines */
router.get('/hotlines', requireAnyPermission(['hotlines:manage', 'hotlines.view']), ctrl.getAdminHotlines);
router.post('/hotlines', requireAnyPermission(['hotlines:manage', 'hotlines.create']), ctrl.createHotline);
router.put('/hotlines/:id', requireAnyPermission(['hotlines:manage', 'hotlines.edit']), ctrl.updateHotline);
router.delete('/hotlines/:id', requireAnyPermission(['hotlines:manage', 'hotlines.delete']), ctrl.deleteHotline);
router.patch('/hotlines/reorder', requireAnyPermission(['hotlines:manage', 'hotlines.edit']), ctrl.reorderHotlines);

router.get('/media', requireAnyPermission(['media:manage', 'media.view']), ctrl.getMedia);
router.post('/media', requireAnyPermission(['media:manage', 'media.manage']), ctrl.createMedia);
router.delete('/media/:id', requireAnyPermission(['media:manage', 'media.manage']), ctrl.deleteMedia);

router.get('/pages', requireAnyPermission(['seo:manage', 'settings.manage', 'settings:manage']), ctrl.getPages);
router.post('/pages', requireAnyPermission(['seo:manage', 'settings.manage', 'settings:manage']), ctrl.createPage);
router.put('/pages/:id', requireAnyPermission(['seo:manage', 'settings.manage', 'settings:manage']), ctrl.updatePage);
router.delete('/pages/:id', requireAnyPermission(['seo:manage', 'settings.manage', 'settings:manage']), ctrl.deletePage);

router.get('/analytics', requireAnyPermission(['analytics:read', 'analytics.view', 'content:read', 'users:manage', 'settings:manage', 'hotlines:manage', 'submissions:manage']), ctrl.getAnalytics);
router.get('/audit-logs', requireAnyPermission(['logs:read', 'logs.view', 'logs:manage']), ctrl.getAuditLogs);
router.get('/backup', requireAnyPermission(['backup:read', 'backups.manage']), ctrl.getBackup);
router.post('/restore', requireAnyPermission(['backup:restore', 'backups.manage']), ctrl.restoreBackup);

export default router;
