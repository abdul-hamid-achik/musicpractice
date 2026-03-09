<script setup lang="ts">
interface UserData {
  email: string
  username: string
  name: string
}

definePageMeta({ middleware: 'auth' })

const auth = useAuth()
const { showSuccess, showError } = useToast()

// Loading state
const isLoading = ref(true)
const isSavingProfile = ref(false)
const isSavingPassword = ref(false)
const isDeletingAccount = ref(false)

// Delete confirmation modal
const isDeleteModalOpen = ref(false)
const deleteConfirmation = ref('')

// Profile form
const profileForm = ref({
  email: '',
  username: '',
  name: '',
})

// Password form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Validation errors
const profileErrors = ref<Record<string, string[]>>({})
const passwordErrors = ref<Record<string, string[]>>({})

// Load user data
async function loadUserData() {
  try {
    const user = await $fetch<UserData>('/api/account')
    profileForm.value = {
      email: user.email,
      username: user.username,
      name: user.name,
    }
  } catch (error) {
    showError('Failed to load account data')
    console.error('Error loading account:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadUserData()
})

// Validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  return username.length >= 3 && username.length <= 30 && usernameRegex.test(username)
}

function validatePassword(password: string): boolean {
  return password.length >= 8
}

// Profile update
async function updateProfile() {
  isSavingProfile.value = true
  profileErrors.value = {}

  try {
    const errors: Record<string, string[]> = {}

    // Validate email
    if (!validateEmail(profileForm.value.email)) {
      errors.email = ['Invalid email format']
    }

    // Validate username
    if (!validateUsername(profileForm.value.username)) {
      errors.username = ['Username must be 3-30 characters and contain only letters, numbers, and underscores']
    }

    // Validate name
    if (profileForm.value.name.length < 1 || profileForm.value.name.length > 50) {
      errors.name = ['Display name must be between 1 and 50 characters']
    }

    if (Object.keys(errors).length > 0) {
      profileErrors.value = errors
      showError('Please fix the validation errors')
      return
    }

    const updatedUser = await $fetch('/api/account/profile', {
      method: 'PUT',
      body: profileForm.value,
    })

    showSuccess('Profile updated successfully')
    
    // Update auth store with new user data
    await auth.fetchUser()
  } catch (error: any) {
    if (error.data?.details) {
      profileErrors.value = error.data.details
    } else {
      showError(error.data?.message || 'Failed to update profile')
    }
    console.error('Error updating profile:', error)
  } finally {
    isSavingProfile.value = false
  }
}

// Password change
async function changePassword() {
  isSavingPassword.value = true
  passwordErrors.value = {}

  try {
    const errors: Record<string, string[]> = {}

    // Validate current password
    if (!passwordForm.value.currentPassword) {
      errors.currentPassword = ['Current password is required']
    }

    // Validate new password
    if (!validatePassword(passwordForm.value.newPassword)) {
      errors.newPassword = ['New password must be at least 8 characters long']
    }

    // Validate password confirmation
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      errors.confirmPassword = ['Passwords do not match']
    }

    if (Object.keys(errors).length > 0) {
      passwordErrors.value = errors
      showError('Please fix the validation errors')
      return
    }

    await $fetch('/api/account/change-password', {
      method: 'POST',
      body: {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword,
      },
    })

    showSuccess('Password changed successfully')
    
    // Reset password form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  } catch (error: any) {
    if (error.data?.details) {
      passwordErrors.value = error.data.details
    } else {
      showError(error.data?.message || 'Failed to change password')
    }
    console.error('Error changing password:', error)
  } finally {
    isSavingPassword.value = false
  }
}

// Delete account
async function deleteAccount() {
  if (deleteConfirmation.value !== 'DELETE') {
    showError('Please type "DELETE" to confirm')
    return
  }

  isDeletingAccount.value = true

  try {
    await $fetch('/api/account', {
      method: 'DELETE',
      body: { confirmation: 'DELETE' },
    })

    showSuccess('Account deleted successfully')
    isDeleteModalOpen.value = false
    
    // Redirect to login
    await auth.logout()
  } catch (error: any) {
    showError(error.data?.message || 'Failed to delete account')
    console.error('Error deleting account:', error)
  } finally {
    isDeletingAccount.value = false
  }
}

function openDeleteModal() {
  isDeleteModalOpen.value = true
  deleteConfirmation.value = ''
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
  deleteConfirmation.value = ''
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-text mb-8">Account Settings</h1>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="max-w-2xl space-y-6" aria-busy="true">
      <SkeletonCard variant="card" height="150px" />
      <SkeletonCard variant="card" height="180px" />
      <SkeletonCard variant="card" height="120px" />
    </div>

    <!-- Account Settings -->
    <div v-else class="max-w-2xl space-y-6">
      <!-- Profile Section -->
      <NordCard title="Profile Information">
        <div class="space-y-4">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm text-text-muted mb-2">Email</label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              :class="{ 'border-red-500': profileErrors.email }"
              placeholder="your@email.com"
            />
            <p v-if="profileErrors.email" class="text-red-500 text-xs mt-1">{{ profileErrors.email[0] }}</p>
          </div>

          <!-- Username -->
          <div>
            <label for="username" class="block text-sm text-text-muted mb-2">Username</label>
            <input
              id="username"
              v-model="profileForm.username"
              type="text"
              class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              :class="{ 'border-red-500': profileErrors.username }"
              placeholder="username"
            />
            <p v-if="profileErrors.username" class="text-red-500 text-xs mt-1">{{ profileErrors.username[0] }}</p>
          </div>

          <!-- Display Name -->
          <div>
            <label for="name" class="block text-sm text-text-muted mb-2">Display Name</label>
            <input
              id="name"
              v-model="profileForm.name"
              type="text"
              class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              :class="{ 'border-red-500': profileErrors.name }"
              placeholder="Your Name"
            />
            <p v-if="profileErrors.name" class="text-red-500 text-xs mt-1">{{ profileErrors.name[0] }}</p>
          </div>

          <!-- Save Button -->
          <NordButton
            variant="primary"
            :disabled="isSavingProfile"
            @click="updateProfile"
          >
            {{ isSavingProfile ? 'Saving...' : 'Save Changes' }}
          </NordButton>
        </div>
      </NordCard>

      <!-- Change Password Section -->
      <NordCard title="Change Password">
        <div class="space-y-4">
          <!-- Current Password -->
          <div>
            <label for="currentPassword" class="block text-sm text-text-muted mb-2">Current Password</label>
            <input
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              type="password"
              class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              :class="{ 'border-red-500': passwordErrors.currentPassword }"
              placeholder="Enter current password"
            />
            <p v-if="passwordErrors.currentPassword" class="text-red-500 text-xs mt-1">{{ passwordErrors.currentPassword[0] }}</p>
          </div>

          <!-- New Password -->
          <div>
            <label for="newPassword" class="block text-sm text-text-muted mb-2">New Password</label>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              :class="{ 'border-red-500': passwordErrors.newPassword }"
              placeholder="Minimum 8 characters"
            />
            <p v-if="passwordErrors.newPassword" class="text-red-500 text-xs mt-1">{{ passwordErrors.newPassword[0] }}</p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm text-text-muted mb-2">Confirm New Password</label>
            <input
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              type="password"
              class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              :class="{ 'border-red-500': passwordErrors.confirmPassword }"
              placeholder="Re-enter new password"
            />
            <p v-if="passwordErrors.confirmPassword" class="text-red-500 text-xs mt-1">{{ passwordErrors.confirmPassword[0] }}</p>
          </div>

          <!-- Save Button -->
          <NordButton
            variant="primary"
            :disabled="isSavingPassword"
            @click="changePassword"
          >
            {{ isSavingPassword ? 'Changing...' : 'Change Password' }}
          </NordButton>
        </div>
      </NordCard>

      <!-- Danger Zone -->
      <NordCard title="Danger Zone">
        <div class="space-y-4">
          <div>
            <p class="text-sm text-text-muted">
              Once you delete your account, there is no going back. This action will permanently delete all your data including:
            </p>
            <ul class="list-disc list-inside text-sm text-text-muted mt-2 space-y-1">
              <li>All practice sessions</li>
              <li>All practice goals</li>
              <li>All song progress</li>
              <li>All ear training scores</li>
              <li>All metronome presets</li>
            </ul>
          </div>
          <NordButton
            variant="danger"
            @click="openDeleteModal"
          >
            Delete Account
          </NordButton>
        </div>
      </NordCard>
    </div>

    <!-- Delete Confirmation Modal -->
    <NordModal :open="isDeleteModalOpen" title="Delete Account" @close="closeDeleteModal">
      <div class="space-y-4">
        <p class="text-text">
          Are you absolutely sure you want to delete your account? This action cannot be undone.
        </p>
        <p class="text-sm text-text-muted">
          Type <strong class="text-red-500">DELETE</strong> in the box below to confirm:
        </p>
        <input
          v-model="deleteConfirmation"
          type="text"
          class="w-full bg-surface-alt text-text border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Type DELETE to confirm"
          @keyup.enter="deleteAccount"
        />
        <div class="flex gap-3 pt-4">
          <NordButton
            variant="secondary"
            :disabled="isDeletingAccount"
            @click="closeDeleteModal"
          >
            Cancel
          </NordButton>
          <NordButton
            variant="danger"
            :disabled="isDeletingAccount || deleteConfirmation !== 'DELETE'"
            @click="deleteAccount"
          >
            {{ isDeletingAccount ? 'Deleting...' : 'Delete Account' }}
          </NordButton>
        </div>
      </div>
    </NordModal>
  </div>
</template>
