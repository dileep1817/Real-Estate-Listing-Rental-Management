import { NavLink, Link, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import PropertyDetails from './pages/PropertyDetails'
import OwnerDashboard from './pages/OwnerDashboard'
import TenantDashboard from './pages/TenantDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import { useAuth } from './context/AuthContext.jsx'
import OwnerProperties from './pages/OwnerProperties'
import AddProperty from './pages/AddProperty'
import EditProperty from './pages/EditProperty'
import Browse from './pages/Browse'
import TenantApplications from './pages/TenantApplications'
import TenantMessages from './pages/TenantMessages'
import TenantSaved from './pages/TenantSaved'
import OwnerListings from './pages/OwnerListings'
import OwnerRequests from './pages/OwnerRequests'
import OwnerMessages from './pages/OwnerMessages'
import OwnerPortfolio from './pages/OwnerPortfolio'
import TenantProfile from './pages/TenantProfile'
import OwnerProfile from './pages/OwnerProfile'

function App() {
  const { user, logout } = useAuth()
  return (
    <div>
      <nav className="navbar container">
        <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/">Home</NavLink>
        {user?.role === 'tenant' && (
          <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/tenant/applications">Applications</NavLink>
        )}
        {user?.role === 'tenant' && (
          <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/tenant/messages">Messages</NavLink>
        )}
        {user?.role === 'tenant' && (
          <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/tenant/saved">Saved</NavLink>
        )}
        {user?.role === 'owner' && (
          <>
            <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/owner/listings">Listings</NavLink>
            <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/owner/requests">Requests</NavLink>
            <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/owner/messages">Messages</NavLink>
            <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/owner/profile">Profile</NavLink>
          </>
        )}
        {user?.role === 'owner' && (
          <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/owner/properties">Properties</NavLink>
        )}
        {user?.role === 'tenant' && (
          <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/tenant/profile">Profile</NavLink>
        )}
        {user?.role === 'admin' && (
          <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/admin">Admin</NavLink>
        )}
        <span className="spacer" />
        {!user ? (
          <>
            <NavLink className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} to="/login">Login</NavLink>
          </>
        ) : (
          <button className="btn btn-primary" onClick={logout}>Logout</button>
        )}
      </nav>
      <div className="container page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/property/:id"
            element={
              <ProtectedRoute>
                <PropertyDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner"
            element={
              <RoleProtectedRoute allow={["owner"]}>
                <OwnerDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/owner/listings"
            element={
              <RoleProtectedRoute allow={["owner"]}>
                <OwnerListings />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/owner/requests"
            element={
              <RoleProtectedRoute allow={["owner"]}>
                <OwnerRequests />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/owner/messages"
            element={
              <RoleProtectedRoute allow={["owner"]}>
                <OwnerMessages />
              </RoleProtectedRoute>
            }
          />
          
          <Route path="/browse" element={<Browse />} />
          <Route
            path="/owner/properties"
            element={
              <RoleProtectedRoute allow={["owner"]}>
                <OwnerProperties />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/owner/properties/new"
            element={
              <RoleProtectedRoute allow={["owner"]}>
                <AddProperty />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/owner/properties/:id/edit"
            element={
              <RoleProtectedRoute allow={["owner"]}>
                <EditProperty />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/tenant"
            element={
              <RoleProtectedRoute allow={["tenant"]}>
                <TenantDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/tenant/applications"
            element={
              <RoleProtectedRoute allow={["tenant"]}>
                <TenantApplications />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/tenant/messages"
            element={
              <RoleProtectedRoute allow={["tenant"]}>
                <TenantMessages />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/tenant/saved"
            element={
              <RoleProtectedRoute allow={["tenant"]}>
                <TenantSaved />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute allow={["admin"]}>
                <AdminDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/tenant/profile"
            element={
              <RoleProtectedRoute allow={["tenant"]}>
                <TenantProfile />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/owner/profile"
            element={
              <RoleProtectedRoute allow={["owner"]}>
                <OwnerProfile />
              </RoleProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  )
}

export default App

