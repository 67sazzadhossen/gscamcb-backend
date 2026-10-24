import catchAsync from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { currentUser } from '../../utils/currentUser';
import { UserServices } from './user.service';
import { userIdSchema } from './user.validation';
const createUser = catchAsync(async (req, res) => {
  const data = await UserServices.createUser(
    req.body,
    currentUser(req).role,
    currentUser(req).id,
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User created successfully',
    data,
  });
});
const listUsers = catchAsync(async (req, res) => {
  const data = await UserServices.listUsers(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully',
    data,
  });
});
const getUser = catchAsync(async (req, res) => {
  const data = await UserServices.getUser(
    userIdSchema.parse(req.params.userId),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data,
  });
});
const getMe = catchAsync(async (req, res) => {
  const data = await UserServices.getUser(currentUser(req).userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account retrieved successfully',
    data,
  });
});
const updateUser = catchAsync(async (req, res) => {
  const data = await UserServices.updateUser(
    userIdSchema.parse(req.params.userId),
    req.body,
    currentUser(req).role,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully',
    data,
  });
});
const recycleUser = catchAsync(async (req, res) => {
  const data = await UserServices.recycleUser(
    userIdSchema.parse(req.params.userId),
    currentUser(req).role,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account moved to recycle bin',
    data,
  });
});
const restoreUser = catchAsync(async (req, res) => {
  const data = await UserServices.restoreUser(
    userIdSchema.parse(req.params.userId),
    currentUser(req).role,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account restored',
    data,
  });
});
const permanentlyDeleteUser = catchAsync(async (req, res) => {
  await UserServices.permanentlyDeleteUser(
    userIdSchema.parse(req.params.userId),
    currentUser(req).role,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account permanently deleted',
    data: null,
  });
});
const recycleBin = catchAsync(async (req, res) => {
  const data = await UserServices.listUsers(req.query, true);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recycle bin retrieved',
    data,
  });
});
export const UserControllers = {
  recycleUser,
  restoreUser,
  permanentlyDeleteUser,
  recycleBin,
  createUser,
  listUsers,
  getUser,
  getMe,
  updateUser,
};
