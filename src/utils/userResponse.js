const userResponse = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
});

module.exports = userResponse;