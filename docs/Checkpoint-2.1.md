### Students: Constantinova Carina and Postovan Teodora

## Topic: An alternative for Yandex Taxi
### Checkpoint 1 in 2nd Laboratory Work
# Service
Service nodes are the ones that do the work a client is interested in. They receive tasks, process them and send back responses. Processing requests is usually costly so we imply the help of gateways and caches. Each service has a database.
- Long-running saga transactions;
A saga is a sequence of local transactions. Each local transaction updates the database and publishes a message or event to trigger the next local transaction in the saga. If a local transaction fails because it violates a business rule then the saga executes a series of compensating transactions that undo the changes that were made by the preceding local transactions.
Our Yandex-like Taxi Application uses the Orchestration-based saga coordination in Trip Service and Payment Service
- Database redundancy/replication + failover. Service instances connect to different DB replicas;
Replication provides redundancy and increases data availability. In previous lab we had database per service pattern.
**Replication rules:**
In this one we will have 3 mongod instances that will maintain the same data set: mongo1, mongo2, mongo3. One of the members goes PRIMARY having the priority number 2, the node that receives _write_ and _read_ all operations, two of other members SECONDARY with priority number 0 that replicate the primary's data sets. 
**Failover mechanism** If to some reason a failover of the primary database, there is a mechanisms of elections implemented. One of the secondary databases becomes PRIMARY.
- Prometheus + Grafana for logging added to all services
# The Gateway
The gateway is the node that receives and forwards user tasks to the service nodes. Based on some logic, the gateway caches responses and balances the load of service nodes. Finally, it has a service registry and chooses from registered services when load balancing.
Features to be implemented:
- Service high availability (if a request to a service fails or the service is otherwise unavailable, route the request to a different one);
- Trip circuit breaker if multiple re-routes happen
We will try to send at least one request to all registered services. If they will all fail, trip and send error:

```js

if (retries <= 0) {
          return res.status(500).send('No service is able to process the request');
        }

        console.log('retrying another service');
        retries--;
        retry();

```
- Prometheus + Grafana for logging;

# Cache
A cache allows your system to temporary store responses given by your services and serve them without bothering the service nodes. Using caches makes your system more responsive. Usually caches use in-memory storage. Rewrote Cache service in python, added API Status inside the service. 

## Languages to be used: 
Typescript, Javascript, Python;
## Tools to be used:
-	Node.js using tool Nx that generates the application;
-	MongoDB;
-	Flask framework for Cache in python;
-	Docker;

# Diagram
![img](lab2.png)
