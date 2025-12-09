import React, { useState, useEffect } from 'react';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Tab,
  Tabs
} from '@mui/material';
import { MessageSquare } from 'lucide-react';
import './ModeratorDashboard.css';

const ModeratorDashboard = () => {
  const { createPost, error, setError, currentUser } = useNavyFederal();
  
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [reportedContent, setReportedContent] = useState([]);

  useEffect(() => {
    fetchPosts();
    fetchComments();
    fetchReportedContent();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts`);
      const data = await response.json();
      setPosts(data.posts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments`);
      const data = await response.json();
      setComments(data.comments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const fetchReportedContent = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reported-content`);
      const data = await response.json();
      setReportedContent(data.reportedContent);
    } catch (err) {
      console.error('Error fetching reported content:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createPost({
        ...newPost,
        isModeratorPost: true
      });
      setIsCreatePostOpen(false);
      setNewPost({ title: '', content: '' });
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Paper className="dashboard-card">
        <div className="dashboard-header">
          <Typography variant="h5" component="h1">Moderator Dashboard</Typography>
          <Typography variant="body2" color="textSecondary">
            Manage community content and interactions
          </Typography>
        </div>

        <div className="dashboard-content">
          <Box className="tabs-container">
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Posts" />
              <Tab label="Comments" />
              <Tab label="Reported Content" />
            </Tabs>
          </Box>

          {/* Posts Tab */}
          {activeTab === 0 && (
            <div className="tab-panel">
              <div className="panel-header">
                <Typography variant="h6">Community Posts</Typography>
                <Button
                  variant="contained"
                  className="create-button"
                  startIcon={<MessageSquare className="button-icon" />}
                  onClick={() => setIsCreatePostOpen(true)}
                >
                  Create Post
                </Button>
              </div>

              <div className="table-container">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post._id}>
                        <TableCell className="cell-truncate">{post.title}</TableCell>
                        <TableCell>{`${post.author.firstName} ${post.author.lastName}`}</TableCell>
                        <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`status-badge status-${post.status.toLowerCase()}`}>
                            {post.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="action-buttons">
                            <Button variant="outlined" className="edit-button">Edit</Button>
                            <Button variant="contained" className="delete-button">Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Create Post Dialog */}
          <Dialog 
            open={isCreatePostOpen} 
            onClose={() => setIsCreatePostOpen(false)}
            className="dialog-container"
          >
            <DialogTitle>Create New Post</DialogTitle>
            <DialogContent>
              <form className="post-form">
                <TextField
                  label="Title"
                  fullWidth
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="form-field"
                />
                <TextField
                  label="Content"
                  fullWidth
                  multiline
                  rows={4}
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="form-field"
                />
              </form>
            </DialogContent>
            <DialogActions className="dialog-actions">
              <Button onClick={() => setIsCreatePostOpen(false)} className="cancel-button">
                Cancel
              </Button>
              <Button 
                variant="contained" 
                disabled={isLoading}
                className="submit-button"
                onClick={handleCreatePost}
              >
                {isLoading ? 'Creating...' : 'Create Post'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Comments Tab */}
          {activeTab === 1 && (
            <div className="tab-panel">
              <Typography variant="h6">Comment Moderation</Typography>
              {/* Comments table implementation */}
            </div>
          )}

          {/* Reported Content Tab */}
          {activeTab === 2 && (
            <div className="tab-panel">
              <Typography variant="h6">Reported Content</Typography>
              {/* Reported content table implementation */}
            </div>
          )}
        </div>
      </Paper>
    </div>
  );
};

export default ModeratorDashboard;