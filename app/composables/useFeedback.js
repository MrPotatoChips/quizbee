export const useFeedback = () => {
  const toast = useToast()

  const notifySuccess = (title, description) => {
    toast.add({
      title,
      description,
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
  }

  const notifyError = (error, title = 'Something went wrong') => {
    toast.add({
      title,
      description: error?.data?.message || error?.statusMessage || error?.message,
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  }

  return {
    notifySuccess,
    notifyError
  }
}
