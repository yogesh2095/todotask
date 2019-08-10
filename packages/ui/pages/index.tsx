import { Layout } from "../components/Layout";
import TASKS_QUERY from "../graphql/tasks.graphql";
import { Query, withApollo, WithApolloClient } from "react-apollo";
import {
  TasksQuery,
  TasksQueryVariables,
  DeleteTaskMutation,
  DeleteTaskMutationVariables,
  TaskStatus,
  ChangeStatusMutation,
  ChangeStatusMutationVariables
} from "../resources/gql-types";
import { Loader } from "../components/Loader";
import { Task } from "../components/Task";
import { WrappedCreateTaskForm } from "../components/CreateTaskForm";
import { ApolloClient } from "apollo-boost";
import DELETE_TASK_MUTATION from "../graphql/delete-task.graphql";
import { useCallback, useState, useEffect } from "react";
import CHANGE_STATUS_MUTATION from "../graphql/change-status.graphql";
import { TaskFilter } from "../components/TaskFilter";
import { NextFunctionComponent } from "next";
import { Notification, NotificationButtons } from "../components/Notifiction";

class ApolloTasksQuery extends Query<TasksQuery, TasksQueryVariables> {}

interface State {
  showNotification: boolean;
}

const initialState: State = {
  showNotification: false
};

interface IntialProps {
  taskFilter?: TaskFilter;
}

interface Props extends IntialProps {}

const deleteTask = async (id: number, apollo: ApolloClient<any>) => {
  const result = await apollo.mutate<
    DeleteTaskMutation,
    DeleteTaskMutationVariables
  >({ mutation: DELETE_TASK_MUTATION, variables: { id } });
  {
    if (result && result.data && result.data.deleteTask) {
      const taskCache = apollo.readQuery<TasksQuery, TasksQueryVariables>({
        query: TASKS_QUERY
      });

      if (taskCache) {
        apollo.writeQuery({
          query: TASKS_QUERY,
          data: { tasks: taskCache.tasks.filter(task => task.id != id) }
        });
      }
    }
  }
};

const changeTaskStatus = async (
  id: number,
  status: TaskStatus,
  taskFilter: TaskFilter,
  apollo: ApolloClient<any>
) => {
  await apollo.mutate<ChangeStatusMutation, ChangeStatusMutationVariables>({
    mutation: CHANGE_STATUS_MUTATION,
    variables: { id, status },
    update: cache => {
      const tasksCache = cache.readQuery<TasksQuery, TasksQueryVariables>({
        query: TASKS_QUERY,
        variables: { status: taskFilter.status }
      });

      if (tasksCache) {
        cache.writeQuery<TasksQuery, TasksQueryVariables>({
          query: TASKS_QUERY,
          variables: { status: taskFilter.status },
          data: {
            tasks: taskFilter.status
              ? tasksCache.tasks.filter(
                  task => task.status === taskFilter.status
                )
              : tasksCache.tasks
          }
        });
      }
    }
  });
};

const IndexPage: NextFunctionComponent<
  WithApolloClient<Props>,
  IntialProps
> = ({ client, taskFilter }) => {
  const deleteTaskCallback = useCallback(
    (id: number) => deleteTask(id, client),
    []
  );

  const changeStatusCallback = useCallback(
    (id: number, status: TaskStatus) =>
      changeTaskStatus(id, status, taskFilter, client),
    [taskFilter]
  );

  const [state, setState] = useState(initialState);

  useEffect(() => {
    const showOffer = sessionStorage.getItem("showOffer");
    setState({
      showNotification: !showOffer || showOffer === "1"
    });
    console.log("USE EFFECT");
  }, []);

  const handleOnClickDismiss = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setState({ showNotification: false });
    sessionStorage.setItem("showOffer", "0");
  };
  return (
    <Layout>
      {state.showNotification && (
        <Notification>
          <p>
            Limited time offer! Get our <em>Pro</em> Subscription
          </p>
          <NotificationButtons>
            <a href="#">Learn More</a>
            <a href="#" onClick={handleOnClickDismiss}>
              Dismiss
            </a>
          </NotificationButtons>
        </Notification>
      )}
      <ApolloTasksQuery
        query={TASKS_QUERY}
        variables={taskFilter}
        fetchPolicy="cache-and-network"
      >
        {({ error, loading, data, refetch }) => {
          if (error) {
            return <div>Something wrong has happened</div>;
          }
          const tasks = data ? data.tasks : [];
          return (
            <div>
              <WrappedCreateTaskForm onCreateTask={refetch} />
              {loading ? (
                <Loader />
              ) : (
                <div>
                  <ul className="tasks">
                    {tasks.map((task, i) => {
                      return (
                        <Task
                          key={i}
                          {...task}
                          onDeleteTask={deleteTaskCallback}
                          onTaskStatusChange={changeStatusCallback}
                        />
                      );
                    })}
                  </ul>
                  <TaskFilter filter={taskFilter} />
                </div>
              )}
            </div>
          );
        }}
      </ApolloTasksQuery>
    </Layout>
  );
};

IndexPage.getInitialProps = ctx => {
  const { status } = ctx.query;

  return {
    taskFilter: {
      status: Array.isArray(status)
        ? (status[0] as TaskStatus)
        : status
        ? (status as TaskStatus)
        : undefined
    }
  };
};

export default withApollo(IndexPage);
