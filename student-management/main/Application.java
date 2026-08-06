package main;

import controller.StudentController;
import model.Student;
import repository.StudentRepository;
import service.StudentService;

public class Application {
    public static void main(String[] args) {
        StudentRepository repository = new StudentRepository();
        StudentService service = new StudentService(repository);
        StudentController controller = new StudentController(service);

        Student alice = controller.addStudent("Alice", "alice@example.com");
        Student bob = controller.addStudent("Bob", "bob@example.com");

        System.out.println("Students after add: " + controller.listStudents().size());
        controller.editStudent(alice.getId(), "Alice Smith", "alice.smith@example.com");
        controller.removeStudent(bob.getId());
        System.out.println("Students after update/delete: " + controller.listStudents().size());
    }
}
