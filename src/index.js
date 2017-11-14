import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import App from './components/App';
import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter } from 'react-router-dom';
import { GC_AUTH_TOKEN } from './constants';
import { ApolloLink, split } from 'apollo-client-preset';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { ApolloProvider } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

const httpLink = new HttpLink({ uri: 'https://api.graph.cool/simple/v1/cj9y26to8133h0136asu8rkmm' });

const middlewareAuthLink = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem(GC_AUTH_TOKEN);
    const authorizationHeader = token ? `Bearer ${token}` : null;
    operation.setContext({
        headers: {
            authorization: authorizationHeader,
        },
    });
    return forward(operation);
});

const httpLinkWithAuthToken = middlewareAuthLink.concat(httpLink);

const wsLink = new WebSocketLink({
    uri: `wss://subscriptions.graph.cool/v1/cj9y26to8133h0136asu8rkmm`,
    options: {
      reconnect: true,
      connectionParams: {
        authToken: localStorage.getItem(GC_AUTH_TOKEN),
      }
    }
  })

  const link = split(
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query)
      return kind === 'OperationDefinition' && operation === 'subscription'
    },
    wsLink,
    httpLinkWithAuthToken,
  )

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache()
  })

ReactDOM.render(
    <BrowserRouter>
        <ApolloProvider client={client}>
            <App />
        </ApolloProvider>
    </BrowserRouter>,
    document.getElementById('root')
);
registerServiceWorker();
