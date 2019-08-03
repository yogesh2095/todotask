import { Layout } from "../components/Layout";
import TASKS_QUERY from "../graphql/tasks.graphql";
import { Query, withApollo } from "react-apollo";
import DELETE_TASK_MUTATION from "../graphql/delete-task.graphql";
import CHANGE_STATUS_MUTATION from "../graphql/change-status.graphql";

import {
  TasksQuery,
  TasksQueryVariables,
  DeleteTaskMutationVariables,
  DeleteTaskMutation,
  TaskStatus,
  ChangeStatusMutation,
  ChangeStatusMutationVariables
} from "../resources/gql-types";
import { Loader } from "../components/Loader";
import { Task } from "../components/Task";
import { WrappedCreateTaskForm } from "../components/CreateTaskForm";
import { ApolloClient } from "apollo-boost";
import { useCallback } from "react";

class ApolloTasksQuery extends Query<TasksQuery, TasksQueryVariables> {}

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
  apollo: ApolloClient<any>
) => {
  await apollo.mutate<ChangeStatusMutation, ChangeStatusMutationVariables>({
    mutation: CHANGE_STATUS_MUTATION,
    variables: { id, status }
  });
};

export default withApollo(({ client }) => {
  const deleteTaskCallback = useCallback(
    (id: number) => deleteTask(id, client),
    []
  );

  const changeStatusCallback = useCallback(
    (id: number, status: TaskStatus) => changeTaskStatus(id, status, client),
    []
  );

  return (
    <Layout>
      <ApolloTasksQuery query={TASKS_QUERY}>
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
              )}
            </div>
          );
        }}
      </ApolloTasksQuery>
    </Layout>
  );
});
