import { Layout } from "../components/Layout";
import TASKS_QUERY from "../graphql/tasks.graphql";
import { Query } from "react-apollo";
import {
  TasksQuery as ITasksQuery,
  TasksQueryVariables
} from "../resources/gql-types";
import { Loader } from "../components/Loader";
import { Task } from "../components/Task";
import { WrappedCreateTaskForm } from "../components/CreateTaskForm";

class TasksQuery extends Query<ITasksQuery, TasksQueryVariables> {}
export default () => (
  <Layout>
    <TasksQuery query={TASKS_QUERY}>
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
              <ul>
                {tasks.map((task, i) => {
                  return (
                    <Task
                      key={i}
                      {...task}
                      onDeleteTask={() => {}}
                      onTaskStatusChange={() => {}}
                    />
                  );
                })}
              </ul>
            )}
          </div>
        );
      }}
    </TasksQuery>
  </Layout>
);
