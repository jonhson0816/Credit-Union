import React, { useState, useEffect } from 'react';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography
} from '@mui/material';
import { Add, CheckCircle, Cancel, PersonAdd } from '@mui/icons-material';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const {
    createAdmin,
    createModerator,
    approvePost,
    getAllUsers,
    error,
    setError
  } = useNavyFederal();

  const [users, setUsers] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'moderator'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPendingPosts();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts/pending`);
      const data = await response.json();
      setPendingPosts(data.posts);
    } catch (err) {
      console.error('Error fetching pending posts:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (newUserData.role === 'admin') {
        await createAdmin(newUserData);
      } else {
        await createModerator(newUserData);
      }
      setIsCreateUserOpen(false);
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'moderator'
      });
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      await approvePost(postId);
      fetchPendingPosts();
    } catch (err) {
      console.error('Error approving post:', err);
    }
  };

  return (
    <div className="admin-dashboard">
      <Paper elevation={3} className="dashboard-container">
        <Box className="dashboard-header">
          <Typography variant="h4">Admin Dashboard</Typography>
          <Typography variant="subtitle1">Manage users and content</Typography>
        </Box>

        <div className="dashboard-content">
          {/* User Management Section */}
          <section className="section">
            <div className="section-header">
              <Typography variant="h5">User Management</Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAdd />}
                onClick={() => setIsCreateUserOpen(true)}
              >
                Create User
              </Button>
            </div>

            <Table className="table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <CheckCircle className="icon-success" />
                      ) : (
                        <Cancel className="icon-error" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* Content Moderation Section */}
          <section className="section">
            <Typography variant="h5" className="section-title">Pending Posts</Typography>
            <Table className="table">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingPosts.map((post) => (
                  <TableRow key={post._id}>
                    <TableCell>{post.title}</TableCell>
                    <TableCell>{`${post.author.firstName} ${post.author.lastName}`}</TableCell>
                    <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="action-buttons">
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleApprovePost(post._id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </div>
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onClose={() => setIsCreateUserOpen(false)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <form onSubmit={handleCreateUser} className="create-user-form">
            <TextField
              label="First Name"
              value={newUserData.firstName}
              onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={newUserData.lastName}
              onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={newUserData.email}
              onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={newUserData.password}
              onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUserData.role}
                onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
              >
                <MenuItem value="moderator">Moderator</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateUserOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateUser}
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;