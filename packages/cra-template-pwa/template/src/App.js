import React, { useState, useEffect } from 'react';
import { ServiceWorkerUpdateListener } from './ServiceWorkerUpdateListener.js';

import { Clock } from './Clock.js'

import logo from './logo.svg';

import Container from '@material-ui/core/Container';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

import './App.css';

console.log('Version 27')
//console.log('window.location.origin: ')
//console.log(window.location.origin)
//console.log('window.location.host: ')
//console.log(window.location.host)
//console.log('window.location.pathname: ')
//console.log(window.location.pathname)
//console.log('window.location.href: ')
//console.log(window.location.href)

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

var wordpressUrl = '';

if (isLocalhost) {
  // Use a wordpress server on a site setup for testing.
  wordpressUrl = process.env.REACT_APP_WORDPRESS_WPAPI
} else {
  // Use the wordpress that served this app
  wordpressUrl = window.location.href.substr(0,window.location.href.lastIndexOf('/',window.location.href.lastIndexOf('/')-1)) + '/wp-json'
}
console.log('WordPress URL: ')
console.log(wordpressUrl)

var WPAPI = require( 'wpapi/browser/wpapi' );
var wp = new WPAPI({ endpoint: wordpressUrl });

const wpFetch = async () => {
  var ret
  await wp.posts().get()
    .then(function( data ) {
        // do something with the returned posts
        console.log('wpFetch .then')
        console.log(data)
        ret = data
    })
    .catch(function( err ) {
        // handle error
        console.log('wpFetch .catch')
        console.log(err)
    }) 
//  console.log('wpFetch end')
//  console.log(ret)
  return ret
}


function App() {

const [posts, setWpPosts] = useState([])
// add these useStates:
  const [updateWaiting, setUpdateWaiting] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [swListener, setSwListener] = useState({});


  useEffect(() => {
    async function fetchData() {
      console.log('useEffect 1')
	  const data = await wpFetch()
      if ( data ) {
        // do something with the returned posts
        console.log('useEffect 2')
        //console.log(data)
        setWpPosts(data)
      }
      console.log('useEffect 3')
      console.log(process.env.NODE_ENV)

      if (process.env.NODE_ENV !== "development") {
        let listener = new ServiceWorkerUpdateListener();
        setSwListener(listener);
        listener.onupdateinstalling = (installingEvent) => {
          console.log("SW installed", installingEvent);
        };
        listener.onupdatewaiting = (waitingEvent) => {
          console.log("new update waiting", waitingEvent);
          setUpdateWaiting(true);
        };
        listener.onupdateready = (event) => {
          console.log("updateready event");
          window.location.reload();
        };
        navigator.serviceWorker.getRegistration().then((reg) => {
          listener.addRegistration(reg);
          setRegistration(reg);
        });
        return () => listener.removeEventListener();
      } else {
        //do nothing because no sw in development
      }

    }
    fetchData()
  }, [] )

  const handleUpdate = () => {
    swListener.skipWaiting(registration.waiting);
  }
          
  return (
    <div className="App">
    
    <Grid container spacing={2}>

      {posts.map((post, index) => (
      <Grid item key={index}>
        <Card>
           <CardContent>
                <Typography
                    color="textSecondary"
                    gutterBottom
                    dangerouslySetInnerHTML={{__html: post.title.rendered}} />
                <Typography
                    variant="body2"
                    component="p"
                    dangerouslySetInnerHTML={{__html: post.content.rendered}} />
            </CardContent>
        </Card>
      </Grid>
     ))}



    </Grid>

    <Clock />
      

      <br />
      <UpdateWaiting updateWaiting={updateWaiting} handleUpdate={handleUpdate}/>

    </div>
  );
}

export default App;

const UpdateWaiting = ({updateWaiting, handleUpdate}) => {
  if (!updateWaiting) return <></>
  return (
    <div>
      Update waiting! <button onClick={handleUpdate}>Update</button>
    </div>
  )
}
