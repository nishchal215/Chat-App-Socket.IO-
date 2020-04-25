const socket=io()    // connect client to server ans socket is the object id of a client

// Elements
const messageForm=document.querySelector('#message-form'),
    messageFormInput=messageForm.querySelector('input'),
    messageFormButton=messageForm.querySelector('button'),
    sendLocationButton=document.querySelector('#send-location')
    messages=document.querySelector('#messages')

// Templates
const messageTemplate=document.querySelector('#message-template').innerHTML,
    locationMessageTemplate=document.querySelector('#location-message-template').innerHTML,
    sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

// Options
// location.search returns the extra data in url and we are going to parse it to an object to use it
// ignoreQueryPrefix: true is used to remove ? from the search result
const {username,room}=Qs.parse(location.search, {ignoreQueryPrefix: true})
// or const {objectName}=Qs.parse(location.search, {ignoreQueryPrefix: true})


// AutoScroll Function
const autoScroll = () =>{

    // New message element
    const newMessage = messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    
    // Visible height
    const visibleHeight = messages.offsetHeight

    // Height of messages container
    const containerHeight = messages.scrollHeight

    // How far have I scrolled
    const scrollOffset = messages.scrollTop + visibleHeight // we add visibleHeight to get position of scrollBottom

    if(containerHeight - newMessageHeight <= scrollOffset){
        messages.scrollTop = messages.scrollHeight
    }
    

}


socket.on('message',(Message)=>{    // client is listening for event 'message' which was called on server side
    console.log(Message)
    const html=Mustache.render(messageTemplate, {
        username:Message.username,
        message:Message.text ,
        createdAt:moment(Message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('locationMessage',(url)=>{    // client is listening for event 'message' which was called on server side
    console.log(url)
    const html=Mustache.render(locationMessageTemplate, {
        username:url.username,
        url:url.url,         // url is short for url:url
        createdAt:moment(url.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})


socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})


messageForm.addEventListener('submit', (e) =>{
    e.preventDefault()  // prevent default behaviour when browser goes through a complete page refresh

    // disable send button upon clicking
    messageFormButton.setAttribute('disabled','disabled')

    const message = e.target.elements.message.value;   // e.target points to the message form and elemnts points to its elements

    socket.emit('sendMessage', message,callback=>{
        messageFormButton.removeAttribute('disabled')   // renable the send button
        messageFormInput.value=''                       // empty the text area
        messageFormInput.focus()
        console.log('Message Delivered')
    })

})

sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation not supported')
    }

    sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition(position =>{
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, callback =>{
            // console.log('Location shared')
            sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join',{username,room}, (error) => {
    if(error){
        alert(error)
        location.href='/'
    }
})