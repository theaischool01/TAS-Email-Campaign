fetch('https://email-campaign-platform-pi.vercel.app/api/create-admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-developer-secret': '47920c7b70b54430b6bb8b6d809e46881d075ce6d44b498a92629a19d67d5700'
  },
  body: JSON.stringify({
    email: 'gantayashwanthreddy8@gmail.com',
    name: 'yashwanth'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
