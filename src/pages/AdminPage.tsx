import React, { useState, useEffect } from 'react';
import { UserPlus, Settings, Users, Lock } from 'lucide-react';
import { db } from '../lib/db';
import { globalSettings } from '../lib/settings';
import { UserSettingsModal } from '../components/UserSettingsModal';

interface User {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
  qbit_url?: string;
  qbit_username?: string;
  qbit_password?: string;
}

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ username: '', password: '', isAdmin: false });
  const [globalConfig, setGlobalConfig] = useState({
    prowlarr_url: '',
    prowlarr_api_key: '',
    tmdb_access_token: '',
    min_seeds: 3
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      // Charger les utilisateurs
      const loadedUsers = await db.getAllUsers();
      setUsers(loadedUsers || []);

      // Charger les paramètres globaux
      const settings = await globalSettings.load();
      if (settings) {
        setGlobalConfig({
          prowlarr_url: settings.prowlarr_url || '',
          prowlarr_api_key: settings.prowlarr_api_key || '',
          tmdb_access_token: settings.tmdb_access_token || '',
          min_seeds: settings.min_seeds || 3
        });
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await db.createUser(newUser.username, newUser.password, newUser.isAdmin);
      const updatedUsers = await db.getAllUsers();
      setUsers(updatedUsers);
      setNewUser({ username: '', password: '', isAdmin: false });
      setSuccess('Utilisateur créé avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await db.deleteUser(userId);
      const updatedUsers = await db.getAllUsers();
      setUsers(updatedUsers);
      setSuccess('Utilisateur supprimé avec succès');
    } catch (err) {
      setError('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await db.updateUser(userId, updates);
      const updatedUsers = await db.getAllUsers();
      setUsers(updatedUsers);
      setSuccess('Utilisateur mis à jour avec succès');
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'utilisateur');
    }
  };

  const handleGlobalSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await globalSettings.updateSettings(globalConfig);
      setSuccess('Paramètres globaux mis à jour avec succès');
    } catch (err) {
      console.error('Settings update error:', err);
      setError('Erreur lors de la mise à jour des paramètres globaux');
    }
  };

  const handleAdminPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwords.new !== passwords.confirm) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    try {
      const adminUser = users.find(u => u.is_admin);
      if (!adminUser) {
        throw new Error('Utilisateur admin non trouvé');
      }

      const loginCheck = await db.verifyUser('admin', passwords.current);
      if (!loginCheck) {
        setError('Mot de passe actuel incorrect');
        return;
      }

      await db.updateUser(adminUser.id, { password: passwords.new });
      setSuccess('Mot de passe administrateur modifié avec succès');
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordChange(false);
    } catch (err) {
      setError('Erreur lors du changement de mot de passe');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {error && (
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {/* Changement de mot de passe admin */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <Lock size={20} />
            Mot de passe administrateur
          </h2>
          {showPasswordChange ? (
            <form onSubmit={handleAdminPasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswords({ current: '', new: '', confirm: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Changer le mot de passe
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowPasswordChange(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Modifier le mot de passe administrateur
            </button>
          )}
        </div>

        {/* Paramètres globaux */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <Settings size={20} />
            Paramètres globaux
          </h2>
          <form onSubmit={handleGlobalSettingsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                URL Prowlarr
              </label>
              <input
                type="url"
                value={globalConfig.prowlarr_url}
                onChange={(e) => setGlobalConfig(c => ({ ...c, prowlarr_url: e.target.value }))}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="http://localhost:9696"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Clé API Prowlarr
              </label>
              <input
                type="text"
                value={globalConfig.prowlarr_api_key}
                onChange={(e) => setGlobalConfig(c => ({ ...c, prowlarr_api_key: e.target.value }))}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Votre clé API Prowlarr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Token d'accès TMDB
              </label>
              <input
                type="text"
                value={globalConfig.tmdb_access_token}
                onChange={(e) => setGlobalConfig(c => ({ ...c, tmdb_access_token: e.target.value }))}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Votre token d'accès TMDB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Nombre minimum de sources (seeds)
              </label>
              <input
                type="number"
                min="0"
                value={globalConfig.min_seeds}
                onChange={(e) => setGlobalConfig(c => ({ ...c, min_seeds: parseInt(e.target.value) }))}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="3"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Enregistrer les paramètres globaux
            </button>
          </form>
        </div>

        {/* Création d'utilisateur */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <UserPlus size={20} />
            Créer un utilisateur
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser(u => ({ ...u, username: e.target.value }))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(u => ({ ...u, password: e.target.value }))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAdmin"
                checked={newUser.isAdmin}
                onChange={(e) => setNewUser(u => ({ ...u, isAdmin: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
              />
              <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-300">
                Administrateur
              </label>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Créer l'utilisateur
            </button>
          </form>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <Users size={20} />
            Utilisateurs
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {user.is_admin ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-900/50 text-blue-400 rounded-full">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded-full">
                          Utilisateur
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!user.is_admin && (
                        <>
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-400 hover:text-blue-300 mr-4"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedUser && (
        <UserSettingsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={handleUpdateUser}
        />
      )}
    </div>
  );
}