import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  Key,
  FileDown,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { authService } from '../../services/authService';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
  lastLogin?: string;
}

interface UserFormData {
  email: string;
  name: string;
  password: string;
  role: 'student' | 'teacher';
  class?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store all users for client-side filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [useBackendSearch, setUseBackendSearch] = useState(false); // Toggle for backend vs frontend search

  // Form states
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    password: '',
    role: 'student',
    class: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bulkUsers, setBulkUsers] = useState<UserFormData[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (search?: string, role?: string) => {
    setIsLoading(true);
    try {
      const params = search || role ? { search, role } : undefined;
      const response = await authService.getAllUsers(params);
      if (response.success && response.data) {
        // The backend now returns { success: true, data: [...], pagination: {...} }
        // response.data is the array of users
        const userData = Array.isArray(response.data) ? response.data : [];
        setUsers(userData);
        if (!params) {
          // Store all users for client-side filtering when no search params
          setAllUsers(userData);
        }
      } else {
        setUsers([]);
        setAllUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('error', '获取用户列表失败');
      setUsers([]); // Set empty array on error to prevent filter issues
      setAllUsers([]);
    }
    setIsLoading(false);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddUser = async () => {
    if (!formData.email || !formData.name || !formData.password) {
      showMessage('error', '请填写所有必填字段');
      return;
    }

    if (formData.role === 'student' && !formData.class) {
      showMessage('error', '学生必须指定班级');
      return;
    }

    setIsLoading(true);
    try {
      // Use admin-specific create user method that doesn't change the current session
      const response = await authService.adminCreateUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        class: formData.class
      });

      if (response.success) {
        showMessage('success', '用户创建成功');
        setShowAddModal(false);
        setFormData({ email: '', name: '', password: '', role: 'student', class: '' });
        fetchUsers();
      } else {
        // Check for specific error messages
        if (response.error?.includes('already exists')) {
          showMessage('error', '该账号已存在，请使用其他账号');
        } else {
          showMessage('error', response.error || '创建用户失败');
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showMessage('error', '创建用户失败');
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newPassword) return;

    setIsLoading(true);
    try {
      const response = await authService.updateUserPassword(selectedUser.id, newPassword);
      if (response.success) {
        showMessage('success', '密码更新成功');
        setShowPasswordModal(false);
        setNewPassword('');
        setSelectedUser(null);
      } else {
        showMessage('error', '密码更新失败');
      }
    } catch (error) {
      showMessage('error', '密码更新失败');
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户吗？此操作不可撤销。')) return;

    setIsLoading(true);
    try {
      const response = await authService.deleteUser(userId);
      if (response.success) {
        showMessage('success', '用户删除成功');
        fetchUsers();
      } else {
        showMessage('error', '删除用户失败');
      }
    } catch (error) {
      showMessage('error', '删除用户失败');
    }
    setIsLoading(false);
  };

  const downloadTemplate = () => {
    const template = [
      { 账号: 'student1', 姓名: '张三', 密码: 'password123', 身份: '学生', 班级: '七年级1班' },
      { 账号: 'teacher1', 姓名: '李老师', 密码: '', 身份: '教师', 班级: '' }  // Empty password will use 'teacher1'
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '用户模板');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Email
      { wch: 15 }, // Name
      { wch: 15 }, // Password
      { wch: 10 }, // Role
      { wch: 15 }  // Class
    ];

    XLSX.writeFile(wb, '用户导入模板.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const parsedUsers: UserFormData[] = data.map((row: any) => {
          const role = (row['身份'] === '教师' || row['role'] === 'teacher') ? 'teacher' : 'student';
          const userClass = row['班级'] || row['class'] || '';
          const account = row['账号'] || row['账号邮箱'] || row['email'] || '';
          // Use account as password if password is empty
          const password = row['密码'] || row['password'] || account;
          
          return {
            email: account,
            name: row['姓名'] || row['name'] || '',
            password: password,
            role,
            class: userClass
          };
        }).filter(u => {
          // Basic validation
          if (!u.email || !u.name) return false;
          // Password will always have a value now (either specified or same as account)
          // Students must have a class
          if (u.role === 'student' && !u.class) return false;
          return true;
        });

        setBulkUsers(parsedUsers);
        if (parsedUsers.length === 0) {
          showMessage('error', '未找到有效的用户数据');
        } else {
          showMessage('success', `成功解析 ${parsedUsers.length} 个用户`);
        }
      } catch (error) {
        showMessage('error', '文件解析失败，请检查文件格式');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImport = async () => {
    if (bulkUsers.length === 0) {
      showMessage('error', '没有要导入的用户');
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    const failedUsers: string[] = [];

    for (const user of bulkUsers) {
      try {
        const response = await authService.register(user);
        if (response.success) {
          successCount++;
        } else {
          failCount++;
          if (response.error?.includes('already exists')) {
            failedUsers.push(`${user.email} (已存在)`);
          } else {
            failedUsers.push(user.email);
          }
        }
      } catch (error) {
        failCount++;
        failedUsers.push(user.email);
      }
    }

    setIsLoading(false);
    let message = `导入完成：成功 ${successCount} 个，失败 ${failCount} 个`;
    if (failedUsers.length > 0) {
      message += `\n失败用户: ${failedUsers.slice(0, 3).join(', ')}${failedUsers.length > 3 ? '...' : ''}`;
    }
    showMessage(
      failCount === 0 ? 'success' : 'error',
      message
    );

    if (successCount > 0) {
      fetchUsers();
      setShowBulkImportModal(false);
      setBulkUsers([]);
    }
  };

  // Handle search with backend
  const handleSearch = () => {
    const searchValue = searchTerm.trim();
    const roleValue = roleFilter === 'all' ? undefined : roleFilter;
    fetchUsers(searchValue || undefined, roleValue);
    setUseBackendSearch(true);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setRoleFilter('all');
    fetchUsers(); // Fetch all users
    setUseBackendSearch(false);
  };

  // Handle Enter key in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Client-side filtering (only when not using backend search)
  const filteredUsers = !useBackendSearch && Array.isArray(allUsers) && allUsers.length > 0
    ? allUsers.filter(user => {
        const matchesSearch = searchTerm === '' || 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
      }) 
    : Array.isArray(users) ? users : [];

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">用户管理</h2>
        <p className="text-gray-600">管理系统中的所有用户账户</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索用户..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setUseBackendSearch(false); // Switch back to client-side filtering on type
                }}
                onKeyPress={handleSearchKeyPress}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any);
                setUseBackendSearch(false); // Switch back to client-side filtering on change
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部角色</option>
              <option value="student">学生</option>
              <option value="teacher">教师</option>
            </select>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              搜索
            </button>

            {/* Clear Button - only show when search is active */}
            {(searchTerm || roleFilter !== 'all' || useBackendSearch) && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                清除
              </button>
            )}

            {/* Search Status Indicator */}
            {useBackendSearch && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  搜索结果: {filteredUsers.length} 个用户
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkImportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              批量导入
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              添加用户
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  账号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(filteredUsers) && filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'teacher'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? '管理员' : user.role === 'teacher' ? '教师' : '学生'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('zh-CN') : '从未登录'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPasswordModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="修改密码"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="删除用户"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!Array.isArray(filteredUsers) || filteredUsers.length === 0) && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">没有找到用户</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">添加新用户</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  账号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="输入账号 (可以是邮箱或用户名)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="张三"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-20"
                    placeholder="输入密码"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                      title="生成随机密码"
                    >
                      生成
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'student' | 'teacher' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="student">学生</option>
                  <option value="teacher">教师</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  班级 {formData.role === 'student' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={formData.role === 'student' ? '例如: 七年级1班' : '可选'}
                />
                {formData.role === 'student' && (
                  <p className="text-xs text-gray-500 mt-1">学生必须指定班级</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleAddUser}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '创建中...' : '创建用户'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">修改密码</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                为用户 <span className="font-semibold">{selectedUser.name}</span> ({selectedUser.email}) 设置新密码
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-20"
                    placeholder="输入新密码"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateRandomPassword())}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                      title="生成随机密码"
                    >
                      生成
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={isLoading || !newPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '更新中...' : '更新密码'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">批量导入用户</h3>
              <button
                onClick={() => {
                  setShowBulkImportModal(false);
                  setBulkUsers([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Step 1: Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">步骤 1：下载模板</h4>
                <p className="text-sm text-blue-700 mb-2">
                  下载Excel模板，按照格式填写用户信息
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                  <p className="text-xs text-yellow-800">
                    <strong>注意：</strong>如果密码列为空，系统将自动使用账号作为默认密码。
                    用户可以在首次登录后修改密码。
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  下载模板
                </button>
              </div>

              {/* Step 2: Upload File */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700">选择文件</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    支持 .xlsx 和 .xls 格式
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    空密码将使用账号作为默认密码
                  </p>
                </div>
              </div>

              {/* Preview Parsed Users */}
              {bulkUsers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">预览导入数据（{bulkUsers.length} 个用户）</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">账号</th>
                          <th className="px-4 py-2 text-left">姓名</th>
                          <th className="px-4 py-2 text-left">密码</th>
                          <th className="px-4 py-2 text-left">角色</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bulkUsers.slice(0, 5).map((user, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{user.email}</td>
                            <td className="px-4 py-2">{user.name}</td>
                            <td className="px-4 py-2">
                              {user.password === user.email ? (
                                <span className="text-yellow-600 text-xs">同账号</span>
                              ) : (
                                '********'
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {user.role === 'teacher' ? '教师' : '学生'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bulkUsers.length > 5 && (
                      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                        还有 {bulkUsers.length - 5} 个用户...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkImportModal(false);
                  setBulkUsers([]);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleBulkImport}
                disabled={isLoading || bulkUsers.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? '导入中...' : `导入 ${bulkUsers.length} 个用户`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}